package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.Product;
import net.java.inventory_app.entity.Transaction;
import net.java.inventory_app.repository.ProductRepository;
import net.java.inventory_app.repository.TransactionRepository;
import net.java.inventory_app.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionServiceImpl implements TransactionService {

    private TransactionRepository transactionRepository;
    private ProductRepository productRepository;

    @Autowired
    public TransactionServiceImpl(TransactionRepository transactionRepository, ProductRepository productRepository) {
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public Transaction recordStockIn(Long productId, Integer quantity, String handler, String notes) {
        // Find the product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setProduct(product);
        transaction.setTransactionType("STOCK_IN");
        transaction.setQuantity(quantity);
        transaction.setHandler(handler);
        transaction.setNotes(notes);

        // Update product stock
        product.setCurrentStock(product.getCurrentStock() + quantity);
        productRepository.save(product);

        // Save transaction
        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public Transaction recordStockOut(Long productId, Integer quantity, String handler, String notes) {
        // Find the product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Check if sufficient stock available
        if (product.getCurrentStock() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + product.getCurrentStock() + ", Requested: " + quantity);
        }

        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setProduct(product);
        transaction.setTransactionType("STOCK_OUT");
        transaction.setQuantity(quantity);
        transaction.setHandler(handler);
        transaction.setNotes(notes);

        // Update product stock
        product.setCurrentStock(product.getCurrentStock() - quantity);
        productRepository.save(product);

        // Save transaction
        return transactionRepository.save(transaction);
    }

    @Override
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    public List<Transaction> getTransactionsByProduct(Long productId) {
        return transactionRepository.findByProductId(productId);
    }

    @Override
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
    }

    @Override
    public Integer getCurrentStock(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        return product.getCurrentStock();
    }
}