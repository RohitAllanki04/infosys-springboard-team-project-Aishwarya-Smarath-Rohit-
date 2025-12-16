package net.java.inventory_app.repository;

import net.java.inventory_app.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    // Find all transactions for a specific product
    List<Transaction> findByProductId(Long productId);
    
    // Find transactions by type
    List<Transaction> findByTransactionType(String transactionType);
    
    // Find transactions between dates
    List<Transaction> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find transactions by handler
    List<Transaction> findByHandler(String handler);
    
    // Find all transactions ordered by timestamp (most recent first)
    List<Transaction> findAllByOrderByTimestampDesc();
}