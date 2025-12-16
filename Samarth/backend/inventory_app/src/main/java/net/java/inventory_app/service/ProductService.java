package net.java.inventory_app.service;

import net.java.inventory_app.entity.Product;
import java.util.List;

public interface ProductService {
    
    // Create a new product
    Product createProduct(Product product);
    
    // Get all products
    List<Product> getAllProducts();
    
    // Get product by ID
    Product getProductById(Long id);
    
    // Update product
    Product updateProduct(Long id, Product product);
    
    // Delete product
    void deleteProduct(Long id);
    
    // Get most bought products
    List<Product> getMostBoughtProducts();
    
    // Get low stock products
    List<Product> getLowStockProducts(Integer threshold);
}