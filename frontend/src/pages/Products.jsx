import React, { useEffect, useState, useMemo } from "react";
import { getProducts, getProductsByVendor, deleteProduct } from "../utils/api";
import ProductForm from "../components/ProductForm";
import { getToken, getProfileFromToken, getProfile } from '../utils/auth'
import { isAdmin, isStoreManager, isUser } from '../utils/roles'

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = () => {
    // If a token/profile exists and user is not an admin, scope products to that vendor/user
    const token = getToken()
    const profileFromToken = token ? getProfileFromToken(token) : null
    const vendor_id = profileFromToken && profileFromToken.id ? profileFromToken.id : null

    const storedProfileLocal = getProfile()
    const roleLocal = storedProfileLocal && storedProfileLocal.role ? storedProfileLocal.role : (token ? (getProfileFromToken(token) || {}).role : null)
    const params = (!isAdmin(roleLocal) && vendor_id) ? { vendor_id } : undefined

    // If we have a vendor id and the user is not an admin, prefer the explicit
    // vendor-by-id endpoint (some backends expose `/api/products/vendor/{id}`).
    const fetchPromise = (!isAdmin(roleLocal) && vendor_id) ? getProductsByVendor(vendor_id) : getProducts(params)

    fetchPromise
      .then(res => {
        const payload = res && res.data ? res.data : null
        // normalize possible shapes: array, { data: [...] }, { products: [...] }
        let rawList = []
        if (Array.isArray(payload)) rawList = payload
        else if (Array.isArray(payload?.data)) rawList = payload.data
        else if (Array.isArray(payload?.products)) rawList = payload.products
        else rawList = []

        // Normalize each product so the UI can read common fields reliably.
        const list = rawList.map(p => {
          const id = p.id || p._id || p._id || (p._doc && (p._doc.id || p._doc._id)) || undefined
          const currentStock = p.currentStock !== undefined ? (typeof p.currentStock === 'string' ? (p.currentStock === '' ? undefined : Number(p.currentStock)) : p.currentStock) : (p.current_stock !== undefined ? Number(p.current_stock) : undefined)
          const reorderLevel = p.reorderLevel !== undefined ? (typeof p.reorderLevel === 'string' ? (p.reorderLevel === '' ? undefined : Number(p.reorderLevel)) : p.reorderLevel) : (p.reorder_level !== undefined ? Number(p.reorder_level) : undefined)
          let vendor = p.vendor
          // If vendor is provided as an id string, leave as-is; components check vendor.fullName/name.
          if (vendor && typeof vendor === 'object') {
            vendor = vendor
          }
          return { ...p, id, currentStock, reorderLevel, vendor }
        })

        setProducts(list)
      })
      .catch(err => {
        console.error('getProducts failed', err)
        setProducts([])
      });
  }

  useEffect(() => {
    refresh()
  }, []);

  // determine role and permissions
  const token = getToken()
  const storedProfile = getProfile()
  const role = storedProfile && storedProfile.role ? storedProfile.role : (token ? (getProfileFromToken(token) || {}).role : null)
  // Only store managers and admins can perform full CRUD on products
  const canEdit = isStoreManager(role) || isAdmin(role)
  
  // Get unique categories and vendors for filters
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);
  
  const vendors = useMemo(() => {
    const vends = new Set(products.map(p => p.vendor?.fullName || p.vendor?.name).filter(Boolean));
    return ['all', ...Array.from(vends)];
  }, [products]);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Hide out-of-stock products from non-editing users (customers)
      if (!canEdit && (p.currentStock === 0 || p.currentStock === '0')) return false;

      // Category filter
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      
      // Vendor filter
      const vendorName = p.vendor?.fullName || p.vendor?.name;
      if (filterVendor !== 'all' && vendorName !== filterVendor) return false;
      
      // Stock status filter
      if (filterStockStatus === 'low' && !(p.currentStock < p.reorderLevel)) return false;
      if (filterStockStatus === 'sufficient' && (p.currentStock < p.reorderLevel)) return false;
      if (filterStockStatus === 'out' && p.currentStock !== 0) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [products, filterCategory, filterVendor, filterStockStatus, searchQuery]);
  
  // Handle CSV import
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const importedProducts = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim());
          const product = {};
          headers.forEach((header, index) => {
            product[header] = values[index];
          });
          importedProducts.push(product);
        }
        
        // TODO: Send to API for batch import
        // await importProducts(importedProducts);
        
        window.dispatchEvent(new CustomEvent('notify', { 
          detail: { type: 'success', message: `Imported ${importedProducts.length} products` } 
        }));
        setShowImport(false);
        refresh();
      } catch (err) {
        console.error(err);
        window.dispatchEvent(new CustomEvent('notify', { 
          detail: { type: 'error', message: 'Failed to import CSV' } 
        }));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Catalog & Product Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            {canEdit ? 'Manage your product inventory' : 'View product catalog'}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              onClick={() => setShowImport(true)}
            >
              📥 Import CSV
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" 
              onClick={() => { setEditingProductId(null); setShowForm(true); }}
            >
              + Add Product
            </button>
          </div>
        )}
      </div>
      
      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Import Products from CSV</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with columns: name, sku, category, currentStock, reorderLevel, vendor
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="w-full mb-4 p-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>
                  {vendor === 'all' ? 'All Vendors' : vendor}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Stock Status</label>
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="sufficient">Sufficient</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
          {!canEdit && (
            <span className="ml-2 text-yellow-600">
              (View only - Contact Store Manager to modify inventory)
            </span>
          )}
        </div>

        {showForm && (
          <div className="mb-4">
            <ProductForm
              productId={editingProductId}
              onDone={() => { setShowForm(false); setEditingProductId(null); refresh(); }}
              onCancel={() => { setShowForm(false); setEditingProductId(null); }}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {canEdit && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="px-4 py-2 text-center text-gray-500">
                    No products found matching your filters
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                <tr key={p.id ?? p.sku ?? JSON.stringify(p)} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2 text-sm">{p.id}</td>
                  <td className="px-4 py-2 text-sm font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-sm font-mono text-gray-600">{p.sku ?? '-'}</td>
                  <td className="px-4 py-2 text-sm">{p.category}</td>
                  <td className={`px-4 py-2 text-sm font-semibold ${
                    p.currentStock === 0 ? 'text-red-600' :
                    (typeof p.currentStock === 'number' && typeof p.reorderLevel === 'number' && p.currentStock < p.reorderLevel) 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    {typeof p.currentStock === 'number' ? p.currentStock : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">{typeof p.reorderLevel === 'number' ? p.reorderLevel : '-'}</td>
                  <td className="px-4 py-2 text-sm">{p.vendor?.fullName ?? p.vendor?.name ?? '-'}</td>
                  <td className="px-4 py-2">
                    {p.currentStock === 0 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Out of Stock
                      </span>
                    ) : (typeof p.currentStock === 'number' && typeof p.reorderLevel === 'number' && p.currentStock < p.reorderLevel) ? (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        In Stock
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition"
                          onClick={() => { setEditingProductId(p.id); setShowForm(true); }}
                        >
                          Edit
                        </button>
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition"
                          onClick={async () => {
                            try {
                              const ok = await (window.showConfirm ? window.showConfirm('Delete this product?') : Promise.resolve(window.confirm('Delete this product?')))
                              if (!ok) return
                              await deleteProduct(p.id)
                              window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Product deleted' } }));
                              refresh()
                            } catch (err) {
                              console.error(err)
                              window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to delete' } }));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
