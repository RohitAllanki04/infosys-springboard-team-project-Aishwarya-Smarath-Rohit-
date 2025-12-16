package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.*;
import net.java.inventory_app.repository.*;
import net.java.inventory_app.service.AIForecastService;
import net.java.inventory_app.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIForecastServiceImpl implements AIForecastService {

    @Autowired
    private DemandForecastRepository forecastRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private HistoricalSalesRepository historicalSalesRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private AlertService alertService;

    @Override
    public DemandForecast generateForecast(Long productId, LocalDate forecastDate, String forecastType) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check if forecast already exists
        Optional<DemandForecast> existing = forecastRepository
                .findByProductIdAndForecastDateAndForecastType(productId, forecastDate, forecastType);
        
        if (existing.isPresent()) {
            return existing.get();
        }

        // Predict demand using AI algorithm
        int daysAhead = forecastType.equals("DAILY") ? 1 : 7;
        Integer predictedDemand = predictDemand(productId, daysAhead);
        Double confidence = calculateConfidence(productId);

        // Create forecast
        DemandForecast forecast = new DemandForecast(product, forecastDate, predictedDemand, confidence, forecastType);
        forecast = forecastRepository.save(forecast);

        // Check for stockout risk
        if (predictedDemand > product.getCurrentStock()) {
            alertService.createStockoutRiskAlert(product, predictedDemand);
        }

        return forecast;
    }

    @Override
    public List<DemandForecast> generateAllForecasts(String forecastType) {
        List<Product> products = productRepository.findAll();
        List<DemandForecast> forecasts = new ArrayList<>();
        
        LocalDate forecastDate = LocalDate.now().plusDays(1);
        
        for (Product product : products) {
            try {
                DemandForecast forecast = generateForecast(product.getId(), forecastDate, forecastType);
                forecasts.add(forecast);
            } catch (Exception e) {
                System.err.println("Error forecasting for product " + product.getName() + ": " + e.getMessage());
            }
        }
        
        return forecasts;
    }

    @Override
    public DemandForecast getForecast(Long productId, LocalDate forecastDate, String forecastType) {
        return forecastRepository
                .findByProductIdAndForecastDateAndForecastType(productId, forecastDate, forecastType)
                .orElse(null);
    }

    @Override
    public List<DemandForecast> getAllForecasts() {
        return forecastRepository.findUpcomingForecasts();
    }

    @Override
    public List<Map<String, Object>> getStockoutRisks() {
        List<DemandForecast> risks = forecastRepository.findStockoutRisks();
        
        return risks.stream().map(forecast -> {
            Map<String, Object> riskInfo = new HashMap<>();
            Product product = forecast.getProduct();
            
            riskInfo.put("productId", product.getId());
            riskInfo.put("productName", product.getName());
            riskInfo.put("currentStock", product.getCurrentStock());
            riskInfo.put("predictedDemand", forecast.getPredictedDemand());
            riskInfo.put("shortfall", forecast.getPredictedDemand() - product.getCurrentStock());
            riskInfo.put("forecastDate", forecast.getForecastDate());
            riskInfo.put("confidence", forecast.getConfidenceScore());
            
            return riskInfo;
        }).collect(Collectors.toList());
    }

    @Override
    public Integer predictDemand(Long productId, int daysAhead) {
        // Get historical sales data (last 30 days)
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);
        
        List<HistoricalSales> historicalData = historicalSalesRepository
                .findByProductIdAndSaleDateBetween(productId, startDate, endDate);
        
        if (historicalData.isEmpty()) {
            // No historical data - use default based on purchase count
            Product product = productRepository.findById(productId).orElse(null);
            if (product != null && product.getPurchaseCount() > 0) {
                return (int) Math.ceil(product.getPurchaseCount() / 30.0 * daysAhead);
            }
            return 5; // Default fallback
        }

        // Simple Moving Average (SMA) Algorithm
        double totalSales = historicalData.stream()
                .mapToInt(HistoricalSales::getQuantitySold)
                .sum();
        
        double averageDailySales = totalSales / historicalData.size();
        
        // Apply trend adjustment (if sales are increasing or decreasing)
        double trendFactor = calculateTrend(historicalData);
        
        // Exponential Smoothing for better accuracy
        double smoothedAverage = applyExponentialSmoothing(historicalData);
        
        // Combine both methods
        double finalPrediction = (smoothedAverage * 0.7 + averageDailySales * 0.3) * (1 + trendFactor) * daysAhead;
        
        return Math.max(1, (int) Math.ceil(finalPrediction));
    }

    private Double calculateConfidence(Long productId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);
        
        List<HistoricalSales> data = historicalSalesRepository
                .findByProductIdAndSaleDateBetween(productId, startDate, endDate);
        
        if (data.isEmpty()) return 50.0;
        if (data.size() < 7) return 60.0;
        if (data.size() < 14) return 75.0;
        
        // Calculate variance
        double mean = data.stream().mapToInt(HistoricalSales::getQuantitySold).average().orElse(0);
        double variance = data.stream()
                .mapToDouble(hs -> Math.pow(hs.getQuantitySold() - mean, 2))
                .average().orElse(0);
        
        double stdDev = Math.sqrt(variance);
        double cv = stdDev / mean; // Coefficient of variation
        
        // Lower variance = higher confidence
        double confidence = Math.max(50, Math.min(95, 95 - (cv * 100)));
        
        return Math.round(confidence * 100.0) / 100.0;
    }

    private double calculateTrend(List<HistoricalSales> data) {
        if (data.size() < 2) return 0.0;
        
        // Compare recent week vs previous week
        int midPoint = data.size() / 2;
        
        double recentAvg = data.subList(midPoint, data.size()).stream()
                .mapToInt(HistoricalSales::getQuantitySold)
                .average().orElse(0);
        
        double previousAvg = data.subList(0, midPoint).stream()
                .mapToInt(HistoricalSales::getQuantitySold)
                .average().orElse(1);
        
        // Return trend as percentage change
        return (recentAvg - previousAvg) / previousAvg;
    }

    private double applyExponentialSmoothing(List<HistoricalSales> data) {
        if (data.isEmpty()) return 0;
        
        double alpha = 0.3; // Smoothing factor (0.2-0.3 is common)
        double smoothed = data.get(0).getQuantitySold();
        
        for (int i = 1; i < data.size(); i++) {
            smoothed = alpha * data.get(i).getQuantitySold() + (1 - alpha) * smoothed;
        }
        
        return smoothed;
    }
}