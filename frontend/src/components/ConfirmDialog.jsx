import React, { useEffect, useState } from 'react'
import { createPurchaseFlat } from '../utils/api'

export default function ConfirmDialog() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [resolveCb, setResolveCb] = useState(null)
  const [mockData, setMockData] = useState(null)
  const [inlineToast, setInlineToast] = useState(null)

  useEffect(() => {
    // expose a helper on window so callers can await a confirmation
    // Accepts either a string or an options object: { message, mockData }
    window.showConfirm = (opts = 'Confirm?') => {
      return new Promise((resolve) => {
        if (typeof opts === 'string') {
          setMessage(opts)
          setMockData(null)
        } else if (opts && typeof opts === 'object') {
          setMessage(String(opts.message || 'Confirm?'))
          setMockData(opts.mockData || null)
        } else {
          setMessage('Confirm?')
          setMockData(null)
        }
        setInlineToast(null)
        setOpen(true)
        setResolveCb(() => resolve)
      })
    }

    const onRealtime = (ev) => {
      // custom realtime activity event (if other parts of app dispatch it)
      try {
        const detail = ev?.detail || ev;
        // If a critical stock event arrives, surface a confirm automatically
        const t = detail?.type || detail?.event || ''
        if (t === 'stock-out' || detail?.status === 'low-stock') {
          const product = detail?.product || detail?.productName || 'Item'
          // open modal asking to create PO
          window.showConfirm({ message: `${product} is low or out of stock. Create a Purchase Order now?`, mockData: detail }).then(choice => {
            // dispatch a notify event so other parts can react
            window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: choice ? 'Purchase Order requested' : 'No action taken' } }))
          })
        }
      } catch (e) { console.debug('confirm: realtime handler', e) }
    }

    const onNotify = (ev) => {
      const d = ev?.detail || {}
      // show inline toast inside modal if open
      if (open) setInlineToast(d)
    }

    window.addEventListener('realtime-activity', onRealtime)
    window.addEventListener('notify', onNotify)

    return () => {
      try { delete window.showConfirm } catch (e) {}
      window.removeEventListener('realtime-activity', onRealtime)
      window.removeEventListener('notify', onNotify)
    }
  }, [open])

  function handleClose(result) {
    setOpen(false)
    if (resolveCb) resolveCb(result)
    setResolveCb(null)
    setMockData(null)
    setInlineToast(null)
  }

  // When user confirms and mockData indicates a PO, call API
  useEffect(() => {
    // placeholder - nothing here
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-40" onClick={() => handleClose(false)} />
      <div className="bg-white rounded shadow p-6 z-10 max-w-md w-full">
        <div className="text-lg font-semibold mb-2">Confirm</div>
        <div className="mb-4 text-gray-700">{message}</div>

        {mockData && (
          <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
            <div className="font-medium mb-2">Preview</div>
            <pre className="overflow-auto text-xs text-gray-700 max-h-40">{JSON.stringify(mockData, null, 2)}</pre>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={async () => {
                  // Attempt to call backend APIs that correspond to the preview
                  try {
                    const d = mockData || {};
                    if (d.type === 'stock-in' || d.type === 'stock-out' || d.type === 'low-stock') {
                      const api = await import('../utils/api');
                      const tx = { productId: d.productId || d.product || null, quantity: Number(d.quantity) || 0, type: d.type === 'stock-in' ? 'IN' : 'OUT', vendorId: d.vendorId || null };
                      await api.createStockTransaction(tx);
                      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Stock transaction created (API)' } }));
                      window.dispatchEvent(new CustomEvent('realtime-activity', { detail: { ...tx, id: Date.now() } }));
                    } else if (d.type === 'purchase-order-created' || d.type === 'stock-out' || /purchase/i.test(d.action || '')) {
                      const api = await import('../utils/api');
                      const prodId = d.productId || (d.product && (d.product.id || d.product._id)) || d.product || null;
                      const vendorId = d.vendorId || (d.vendor && (d.vendor.id || d.vendor._id)) || d.vendor || null;
                      const payload = { quantity: Number(d.quantity) || 1, status: 'PENDING', product: prodId ? { id: prodId } : undefined, vendor: vendorId ? { id: vendorId } : undefined };
                      await api.createPurchaseFlat(payload);
                      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase order created (API)' } }));
                      window.dispatchEvent(new CustomEvent('realtime-activity', { detail: { ...payload, id: Date.now(), type: 'purchase-order-created' } }));
                    } else if (d.type === 'product-added') {
                      const api = await import('../utils/api');
                      const res = await api.createProduct({ name: d.product || d.name || 'New Product' });
                      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Product created (API)' } }));
                      window.dispatchEvent(new CustomEvent('realtime-activity', { detail: res?.data || { id: Date.now(), type: 'product-added', product: d.product } }));
                    } else if (d.type === 'supplier-added' || d.type === 'supplier-updated') {
                      const api = await import('../utils/api');
                      const body = { name: d.name, contact: d.contact, email: d.email };
                      if (d.type === 'supplier-added') {
                        const res = await api.createSupplier(body);
                        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Supplier created (API)' } }));
                        window.dispatchEvent(new CustomEvent('realtime-activity', { detail: res?.data || { ...body, id: Date.now(), type: 'supplier-added' } }));
                      } else {
                        const id = d.id;
                        await api.updateSupplier(id, body);
                        window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Supplier updated (API)' } }));
                        window.dispatchEvent(new CustomEvent('realtime-activity', { detail: { ...body, id, type: 'supplier-updated' } }));
                      }
                    } else {
                      // nothing matched; fallback to emitting event locally
                      window.dispatchEvent(new CustomEvent('realtime-activity', { detail: mockData }));
                      window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'info', message: 'Emitted local event (no matching API)' } }));
                    }
                    setInlineToast({ type: 'success', message: 'API simulate completed' });
                  } catch (err) {
                    console.debug('simulate API call failed', err);
                    setInlineToast({ type: 'warning', message: 'API simulate failed — emitted local event' });
                    window.dispatchEvent(new CustomEvent('realtime-activity', { detail: mockData }));
                  }
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
              >Simulate (API)</button>
              <button
                onClick={() => { setMockData(null) }}
                className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition"
              >Close preview</button>
            </div>
          </div>
        )}

        {inlineToast && (
          <div className={`mb-4 p-2 rounded text-sm ${inlineToast.type === 'error' ? 'bg-red-50 text-red-800' : inlineToast.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
            {inlineToast.message}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition" onClick={() => handleClose(false)}>Cancel</button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={async () => {
              try {
                // If mockData suggests creating a purchase order, call API
                const shouldCreatePO = mockData && (mockData.type === 'stock-out' || mockData.action === 'create-po' || /purchase order/i.test(message));
                if (shouldCreatePO) {
                  const prodId = mockData.productId || (mockData.product && (mockData.product.id || mockData.product._id)) || mockData.product || mockData.sku || null;
                  const vendorId = mockData.vendorId || (mockData.vendor && (mockData.vendor.id || mockData.vendor._id)) || mockData.vendor || null;
                  const quantity = Number(mockData.quantity) || 1;
                  const payload = {
                    quantity,
                    status: 'PENDING',
                    product: prodId ? { id: prodId } : undefined,
                    vendor: vendorId ? { id: vendorId } : undefined,
                  };
                  try {
                    await createPurchaseFlat(payload);
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Purchase Order created' } }));
                  } catch (err) {
                    console.error('createPurchaseFlat failed', err);
                    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to create Purchase Order' } }));
                  }
                }
              } catch (e) {
                console.debug('Confirm action failed', e);
              } finally {
                handleClose(true);
              }
            }}
          >Confirm</button>
        </div>
      </div>
    </div>
  )
}
