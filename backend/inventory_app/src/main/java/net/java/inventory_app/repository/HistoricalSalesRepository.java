package net.java.inventory_app.repository;

import net.java.inventory_app.entity.HistoricalSales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface HistoricalSalesRepository extends JpaRepository<HistoricalSales, Long> {
    List<HistoricalSales> findByProductId(Long productId);
    List<HistoricalSales> findByProductIdAndSaleDateBetween(Long productId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT hs FROM HistoricalSales hs WHERE hs.product.id = ?1 ORDER BY hs.saleDate DESC")
    List<HistoricalSales> findRecentSalesByProduct(Long productId);
    
    @Query("SELECT SUM(hs.quantitySold) FROM HistoricalSales hs WHERE hs.product.id = ?1 AND hs.saleDate BETWEEN ?2 AND ?3")
    Integer getTotalSalesForPeriod(Long productId, LocalDate startDate, LocalDate endDate);
}