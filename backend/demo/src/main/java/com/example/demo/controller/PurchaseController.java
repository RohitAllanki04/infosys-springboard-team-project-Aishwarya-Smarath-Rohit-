package com.example.demo.controller;

import com.example.demo.model.Purchase;
import com.example.demo.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    // CREATE
    @PostMapping
    public Purchase createPurchase(@RequestBody Purchase purchase) {
        return purchaseService.createPurchase(purchase);
    }

    // GET ALL
    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseService.getAllPurchases();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public Purchase getPurchaseById(@PathVariable Long id) {
        return purchaseService.getPurchaseById(id);
    }

    // GET BY VENDOR ID
    @GetMapping("/vendor/{vendorId}")
    public List<Purchase> getPurchasesByVendor(@PathVariable Long vendorId) {
        return purchaseService.getPurchasesByVendor(vendorId);
    }

    // UPDATE PURCHASE
    @PutMapping("/{id}")
    public Purchase updatePurchase(@PathVariable Long id, @RequestBody Purchase purchase) {
        return purchaseService.updatePurchase(id, purchase);
    }
}
