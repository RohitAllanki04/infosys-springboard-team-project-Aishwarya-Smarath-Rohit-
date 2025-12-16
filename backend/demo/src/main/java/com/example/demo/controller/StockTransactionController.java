package com.example.demo.controller;

import com.example.demo.model.StockTransaction;
import com.example.demo.service.StockTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-transactions")
public class StockTransactionController {

    @Autowired
    private StockTransactionService stockTransactionService;

    // CREATE (POST)
    @PostMapping
    public StockTransaction createTransaction(@RequestBody StockTransaction transaction) {
        return stockTransactionService.createTransaction(transaction);
    }

    // UPDATE (PUT)
    @PutMapping("/{id}")
    public StockTransaction updateTransaction(@PathVariable Long id, @RequestBody StockTransaction updated) {
        return stockTransactionService.updateTransaction(id, updated);
    }

    // GET ALL
    @GetMapping
    public List<StockTransaction> getAllTransactions() {
        return stockTransactionService.getAllTransactions();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public StockTransaction getTransactionById(@PathVariable Long id) {
        return stockTransactionService.getTransactionById(id);
    }

    // GET BY VENDOR ID
    @GetMapping("/vendor/{vendorId}")
    public List<StockTransaction> getTransactionsByVendorId(@PathVariable Long vendorId) {
        return stockTransactionService.getTransactionsByVendorId(vendorId);
    }
}
