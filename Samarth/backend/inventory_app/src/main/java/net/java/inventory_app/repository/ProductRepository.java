package net.java.inventory_app.repository;

import net.java.inventory_app.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Get most bought products - Using native SQL to avoid JPA issues
    @Query(value = "SELECT * FROM products ORDER BY purchase_count DESC LIMIT 10", nativeQuery = true)
    List<Product> findTop10ByOrderByPurchaseCountDesc();
    
    // Get low stock products - Using native SQL
    @Query(value = "SELECT * FROM products WHERE current_stock < ?1 AND current_stock > 0 ORDER BY current_stock ASC", nativeQuery = true)
    List<Product> findByCurrentStockLessThanAndCurrentStockGreaterThan(Integer threshold, Integer min);
}