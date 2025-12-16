package net.java.inventory_app.service;

import net.java.inventory_app.entity.PurchaseOrder;
import net.java.inventory_app.entity.Alert;

public interface NotificationService {
    
    // Send purchase order email to vendor
    boolean sendPurchaseOrderEmail(PurchaseOrder po);
    
    // Send alert notification
    boolean sendAlertNotification(Alert alert, String recipientEmail);
    
    // Send SMS notification (placeholder for future implementation)
    boolean sendSMSNotification(String phoneNumber, String message);
}