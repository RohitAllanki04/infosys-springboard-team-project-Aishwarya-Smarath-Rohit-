package net.java.inventory_app.service;

import net.java.inventory_app.entity.Transaction;
import java.util.List;

public interface TransactionService {
    
    // Record stock-in transaction
    Transaction recordStockIn(Long productId, Integer quantity, String handler, String notes);
    
    // Record stock-out transaction
    Transaction recordStockOut(Long productId, Integer quantity, String handler, String notes);
    
    // Get all transactions
    List<Transaction> getAllTransactions();
    
    // Get transactions by product
    List<Transaction> getTransactionsByProduct(Long productId);
    
    // Get transaction by ID
    Transaction getTransactionById(Long id);
    
    // Get current stock of a product
    Integer getCurrentStock(Long productId);
}