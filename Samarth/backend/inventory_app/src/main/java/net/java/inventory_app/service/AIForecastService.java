package net.java.inventory_app.service;

import net.java.inventory_app.entity.DemandForecast;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AIForecastService {
    
    // Generate forecast for a specific product
    DemandForecast generateForecast(Long productId, LocalDate forecastDate, String forecastType);
    
    // Generate forecasts for all products
    List<DemandForecast> generateAllForecasts(String forecastType);
    
    // Get forecast for a product
    DemandForecast getForecast(Long productId, LocalDate forecastDate, String forecastType);
    
    // Get all forecasts
    List<DemandForecast> getAllForecasts();
    
    // Get stockout risks
    List<Map<String, Object>> getStockoutRisks();
    
    // Analyze historical data and predict
    Integer predictDemand(Long productId, int daysAhead);
}