package net.java.inventory_app.service;

import net.java.inventory_app.entity.Alert;
import net.java.inventory_app.entity.Product;
import java.util.List;

public interface AlertService {
    
    // Create different types of alerts
    Alert createLowStockAlert(Product product);
    Alert createExpiryAlert(Product product);
    Alert createStockoutRiskAlert(Product product, Integer predictedDemand);
    
    // Get all alerts
    List<Alert> getAllAlerts();
    
    // Get unread alerts
    List<Alert> getUnreadAlerts();
    
    // Mark alert as read
    Alert markAsRead(Long alertId);
    
    // Get alerts by type
    List<Alert> getAlertsByType(String alertType);
    
    // Get alerts by severity
    List<Alert> getAlertsBySeverity(String severity);
    
    // Count unread alerts
    Long countUnreadAlerts();
    
    // Check and create alerts for all products
    void checkAndCreateAlerts();
}