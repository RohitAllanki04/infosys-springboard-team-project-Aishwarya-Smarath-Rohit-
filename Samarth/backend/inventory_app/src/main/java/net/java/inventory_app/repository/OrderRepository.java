package net.java.inventory_app.repository;

import net.java.inventory_app.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find orders by user
    List<Order> findByUserId(Long userId);
    
    // Find orders by status
    List<Order> findByStatus(String status);
    
    // Find orders between dates
    List<Order> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find all orders ordered by date (most recent first)
    List<Order> findAllByOrderByOrderDateDesc();
    
    // Count orders for today - NATIVE SQL
    @Query(value = "SELECT COUNT(*) FROM orders WHERE DATE(order_date) = CURDATE()", nativeQuery = true)
    Long countOrdersToday();
    
    // Sum revenue for today - NATIVE SQL
    @Query(value = "SELECT COALESCE(SUM(total_amount), 0.0) FROM orders WHERE DATE(order_date) = CURDATE()", nativeQuery = true)
    Double sumRevenueToday();
    
    // Count orders for current month - NATIVE SQL
    @Query(value = "SELECT COUNT(*) FROM orders WHERE MONTH(order_date) = MONTH(CURDATE()) AND YEAR(order_date) = YEAR(CURDATE())", nativeQuery = true)
    Long countOrdersThisMonth();
    
    // Sum revenue for current month - NATIVE SQL
    @Query(value = "SELECT COALESCE(SUM(total_amount), 0.0) FROM orders WHERE MONTH(order_date) = MONTH(CURDATE()) AND YEAR(order_date) = YEAR(CURDATE())", nativeQuery = true)
    Double sumRevenueThisMonth();
}