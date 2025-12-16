package com.example.demo.service;

import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.Repo.ProductRepository;
import com.example.demo.Repo.UserRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final UserRepo userRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              UserRepo userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));
    }

    @Override
    public List<Product> getProductsByVendorId(Long vendorId) {
        return productRepository.findByVendorId(vendorId);
    }

    @Override
    public Product createProduct(Product product, Long vendorId) {

        // SKU check
        if (productRepository.existsBySku(product.getSku())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SKU already exists");
        }

        // Set vendor from JWT user id
        User vendor = userRepository.findById(vendorId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));

        product.setVendor(vendor);

        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long id, Product updated) {
        Product existing = getProductById(id);

        existing.setName(updated.getName());
        existing.setSku(updated.getSku());
        existing.setCategory(updated.getCategory());
        existing.setReorderLevel(updated.getReorderLevel());
        existing.setCurrentStock(updated.getCurrentStock());

        // IMPORTANT: DO NOT ALLOW vendor change here
        // existing.setVendor(updated.getVendor());  // ❌ Remove this

        return productRepository.save(existing);
    }

    @Override
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(id);
    }
}
