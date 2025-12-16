package com.example.demo.service;

import com.example.demo.model.Product;
import java.util.List;

public interface ProductService {
    List<Product> getAllProducts();
    List<Product> getProductsByVendorId(Long vendor);
    Product getProductById(Long id);
    Product createProduct(Product product,Long vendorId);
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id);
}
