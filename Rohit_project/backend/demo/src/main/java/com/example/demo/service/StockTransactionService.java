package com.example.demo.service;

import com.example.demo.model.StockTransaction;

import java.util.List;

public interface StockTransactionService {

    StockTransaction createTransaction(StockTransaction transaction);

    StockTransaction updateTransaction(Long id, StockTransaction updatedTransaction);

    List<StockTransaction> getAllTransactions();

    StockTransaction getTransactionById(Long id);

    List<StockTransaction> getTransactionsByVendorId(Long vendorId);
}
