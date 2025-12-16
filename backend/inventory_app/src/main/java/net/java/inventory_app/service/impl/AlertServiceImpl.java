package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.Alert;
import net.java.inventory_app.entity.Product;
import net.java.inventory_app.repository.AlertRepository;
import net.java.inventory_app.repository.ProductRepository;
import net.java.inventory_app.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AlertServiceImpl implements AlertService {

    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private ProductRepository productRepository;

    @Override
    public Alert createLowStockAlert(Product product) {
        String severity = calculateLowStockSeverity(product);
        String message = String.format("Low stock alert: %s has only %d units remaining (Reorder point: %d)", 
                product.getName(), product.getCurrentStock(), product.getReorderPoint());
        
        Alert alert = new Alert("LOW_STOCK", product, severity, message);
        return alertRepository.save(alert);
    }

    @Override
    public Alert createExpiryAlert(Product product) {
        if (product.getExpiryDate() == null) {
            throw new RuntimeException("Product has no expiry date");
        }
        
        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), product.getExpiryDate());
        String severity = calculateExpirySeverity(daysUntilExpiry);
        
        String message = String.format("Expiry warning: %s will expire in %d days (Expiry date: %s)", 
                product.getName(), daysUntilExpiry, product.getExpiryDate());
        
        Alert alert = new Alert("EXPIRY_WARNING", product, severity, message);
        return alertRepository.save(alert);
    }

    @Override
    public Alert createStockoutRiskAlert(Product product, Integer predictedDemand) {
        int shortfall = predictedDemand - product.getCurrentStock();
        String severity = calculateStockoutRiskSeverity(shortfall, product.getCurrentStock());
        
        String message = String.format("Stockout risk: %s - Predicted demand (%d) exceeds current stock (%d). Shortfall: %d units", 
                product.getName(), predictedDemand, product.getCurrentStock(), shortfall);
        
        Alert alert = new Alert("STOCKOUT_RISK", product, severity, message);
        return alertRepository.save(alert);
    }

    @Override
    public List<Alert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public List<Alert> getUnreadAlerts() {
        return alertRepository.findByIsReadOrderByCreatedAtDesc(false);
    }

    @Override
    public Alert markAsRead(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setIsRead(true);
        return alertRepository.save(alert);
    }

    @Override
    public List<Alert> getAlertsByType(String alertType) {
        return alertRepository.findByAlertTypeAndIsRead(alertType, false);
    }

    @Override
    public List<Alert> getAlertsBySeverity(String severity) {
        return alertRepository.findBySeverityAndIsRead(severity, false);
    }

    @Override
    public Long countUnreadAlerts() {
        return alertRepository.countByIsRead(false);
    }

    @Override
    public void checkAndCreateAlerts() {
        List<Product> products = productRepository.findAll();
        
        for (Product product : products) {
            try {
                // Check low stock
                if (product.getCurrentStock() <= product.getReorderPoint()) {
                    createLowStockAlert(product);
                }
                
                // Check expiry
                if (product.getExpiryDate() != null) {
                    long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), product.getExpiryDate());
                    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                        createExpiryAlert(product);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error creating alert for product " + product.getName() + ": " + e.getMessage());
            }
        }
    }

    // Helper methods
    private String calculateLowStockSeverity(Product product) {
        int stock = product.getCurrentStock();
        int reorderPoint = product.getReorderPoint();
        
        if (stock == 0) return "CRITICAL";
        if (stock <= reorderPoint / 3) return "HIGH";
        if (stock <= reorderPoint * 2 / 3) return "MEDIUM";
        return "LOW";
    }

    private String calculateExpirySeverity(long daysUntilExpiry) {
        if (daysUntilExpiry <= 3) return "CRITICAL";
        if (daysUntilExpiry <= 7) return "HIGH";
        if (daysUntilExpiry <= 14) return "MEDIUM";
        return "LOW";
    }

    private String calculateStockoutRiskSeverity(int shortfall, int currentStock) {
        double ratio = (double) shortfall / Math.max(currentStock, 1);
        
        if (ratio >= 2.0) return "CRITICAL";
        if (ratio >= 1.0) return "HIGH";
        if (ratio >= 0.5) return "MEDIUM";
        return "LOW";
    }
}