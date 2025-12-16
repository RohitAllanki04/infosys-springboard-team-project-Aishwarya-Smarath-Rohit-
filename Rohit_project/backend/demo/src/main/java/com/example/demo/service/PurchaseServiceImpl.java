package com.example.demo.service;

import com.example.demo.model.Product;
import com.example.demo.model.Purchase;
import com.example.demo.Repo.ProductRepository;
import com.example.demo.Repo.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseServiceImpl implements PurchaseService {

    @Autowired
    private PurchaseOrderRepository purchaseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public Purchase createPurchase(Purchase purchase) {

        Product product = purchase.getProduct();

        // Decrease stock based on purchase quantity
        int newStock = product.getCurrentStock() - purchase.getQuantity();

        if (newStock < 0) {
            throw new IllegalStateException("Not enough stock available");
        }

        product.setCurrentStock(newStock);
        productRepository.save(product);

        return purchaseRepository.save(purchase);
    }

    @Override
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    @Override
    public Purchase getPurchaseById(Long id) {
        return purchaseRepository.findById(id).orElse(null);
    }

    @Override
    public List<Purchase> getPurchasesByVendor(Long vendorId) {
        return purchaseRepository.findByVendorId(vendorId);
    }

    @Override
    public Purchase updatePurchase(Long id, Purchase purchase) {

        Purchase existing = purchaseRepository.findById(id).orElse(null);
        if (existing == null) return null;

        // Adjust stock if quantity changed
        int delta = purchase.getQuantity() - existing.getQuantity();
        Product product = existing.getProduct();

        int newStock = product.getCurrentStock() - delta;
        if (newStock < 0) {
            throw new IllegalStateException("Not enough stock available");
        }

        product.setCurrentStock(newStock);
        productRepository.save(product);

        existing.setQuantity(purchase.getQuantity());
        existing.setStatus(purchase.getStatus());
        existing.setProduct(purchase.getProduct());
        existing.setVendor(purchase.getVendor());

        return purchaseRepository.save(existing);
    }
}
