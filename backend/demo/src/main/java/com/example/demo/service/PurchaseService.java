
package com.example.demo.service;
import com.example.demo.model.Purchase;
import java.util.List;
public interface PurchaseService {
    Purchase createPurchase(Purchase purchase);
    List<Purchase> getAllPurchases();
    Purchase getPurchaseById(Long id);
    List<Purchase> getPurchasesByVendor(Long vendorId);
    Purchase updatePurchase(Long id, Purchase purchase);
}


