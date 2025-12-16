package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.Product;
import net.java.inventory_app.repository.ProductRepository;
import net.java.inventory_app.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private ProductRepository productRepository;

    @Autowired
    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Override
    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        
        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setImageUrl(productDetails.getImageUrl());
        
        return productRepository.save(product);
    }

    @Override
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Override
    public List<Product> getMostBoughtProducts() {
        try {
            System.out.println("=== ProductService: getMostBoughtProducts called ===");
            
            // FALLBACK: If repository method fails, use Java sorting
            try {
                List<Product> products = productRepository.findTop10ByOrderByPurchaseCountDesc();
                System.out.println("Repository method succeeded, returned " + products.size() + " products");
                return products;
            } catch (Exception repoError) {
                System.err.println("Repository method failed, using fallback: " + repoError.getMessage());
                
                // Fallback: Get all products and sort in Java
                List<Product> allProducts = productRepository.findAll();
                System.out.println("Got " + allProducts.size() + " total products");
                
                List<Product> sorted = allProducts.stream()
                        .sorted((p1, p2) -> Integer.compare(
                            p2.getPurchaseCount() != null ? p2.getPurchaseCount() : 0,
                            p1.getPurchaseCount() != null ? p1.getPurchaseCount() : 0
                        ))
                        .limit(10)
                        .collect(Collectors.toList());
                
                System.out.println("Sorted and limited to " + sorted.size() + " products");
                return sorted;
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching most bought products: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch most bought products: " + e.getMessage());
        }
    }

    @Override
    public List<Product> getLowStockProducts(Integer threshold) {
        try {
            System.out.println("=== ProductService: getLowStockProducts called with threshold " + threshold + " ===");
            
            // FALLBACK: If repository method fails, use Java filtering
            try {
                List<Product> products = productRepository.findByCurrentStockLessThanAndCurrentStockGreaterThan(threshold, 0);
                System.out.println("Repository method succeeded, returned " + products.size() + " products");
                return products;
            } catch (Exception repoError) {
                System.err.println("Repository method failed, using fallback: " + repoError.getMessage());
                
                // Fallback: Get all products and filter in Java
                List<Product> allProducts = productRepository.findAll();
                List<Product> filtered = allProducts.stream()
                        .filter(p -> p.getCurrentStock() < threshold && p.getCurrentStock() > 0)
                        .collect(Collectors.toList());
                
                System.out.println("Filtered to " + filtered.size() + " low stock products");
                return filtered;
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching low stock products: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch low stock products: " + e.getMessage());
        }
    }
}