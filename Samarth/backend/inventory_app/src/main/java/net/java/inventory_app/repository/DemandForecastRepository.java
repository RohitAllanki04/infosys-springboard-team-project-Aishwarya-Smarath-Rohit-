package net.java.inventory_app.repository;

import net.java.inventory_app.entity.DemandForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DemandForecastRepository extends JpaRepository<DemandForecast, Long> {
    
    // Find forecasts by product
    List<DemandForecast> findByProductId(Long productId);
    
    // Find forecasts by date range
    List<DemandForecast> findByForecastDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Find forecast for specific product and date
    Optional<DemandForecast> findByProductIdAndForecastDateAndForecastType(Long productId, LocalDate forecastDate, String forecastType);
    
    // Get latest forecasts
    @Query("SELECT df FROM DemandForecast df WHERE df.forecastDate >= CURRENT_DATE ORDER BY df.forecastDate ASC")
    List<DemandForecast> findUpcomingForecasts();
    
    // Find high-risk products (predicted demand > current stock)
    @Query("SELECT df FROM DemandForecast df WHERE df.predictedDemand > df.product.currentStock AND df.forecastDate >= CURRENT_DATE")
    List<DemandForecast> findStockoutRisks();
}