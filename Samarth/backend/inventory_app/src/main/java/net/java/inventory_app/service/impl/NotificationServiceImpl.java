package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.Alert;
import net.java.inventory_app.entity.PurchaseOrder;
import net.java.inventory_app.entity.PurchaseOrderItem;
import net.java.inventory_app.service.NotificationService;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public boolean sendPurchaseOrderEmail(PurchaseOrder po) {
        try {
            // TODO: Implement actual email sending using JavaMailSender
            // For now, just log the email content
            
            String emailContent = buildPurchaseOrderEmail(po);
            System.out.println("=== EMAIL TO VENDOR ===");
            System.out.println("To: " + po.getVendorEmail());
            System.out.println("Subject: Purchase Order " + po.getPoNumber());
            System.out.println("\n" + emailContent);
            System.out.println("======================");
            
            // Simulate successful email send
            return true;
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean sendAlertNotification(Alert alert, String recipientEmail) {
        try {
            // TODO: Implement actual email sending
            String emailContent = buildAlertEmail(alert);
            
            System.out.println("=== ALERT NOTIFICATION ===");
            System.out.println("To: " + recipientEmail);
            System.out.println("Subject: Alert - " + alert.getAlertType());
            System.out.println("\n" + emailContent);
            System.out.println("========================");
            
            return true;
        } catch (Exception e) {
            System.err.println("Error sending alert notification: " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean sendSMSNotification(String phoneNumber, String message) {
        try {
            // TODO: Implement SMS sending using Twilio or similar service
            System.out.println("=== SMS NOTIFICATION ===");
            System.out.println("To: " + phoneNumber);
            System.out.println("Message: " + message);
            System.out.println("======================");
            
            return true;
        } catch (Exception e) {
            System.err.println("Error sending SMS: " + e.getMessage());
            return false;
        }
    }

    // Helper Methods
    private String buildPurchaseOrderEmail(PurchaseOrder po) {
        StringBuilder email = new StringBuilder();
        
        email.append("Dear ").append(po.getVendorName()).append(",\n\n");
        email.append("Please find our purchase order details below:\n\n");
        email.append("Purchase Order Number: ").append(po.getPoNumber()).append("\n");
        email.append("Date: ").append(formatDate(po.getCreatedAt())).append("\n");
        email.append("Created By: ").append(po.getCreatedBy().getFullName()).append("\n\n");
        
        email.append("Items:\n");
        email.append("-----------------------------------------------------------\n");
        email.append(String.format("%-30s %10s %15s %15s\n", "Product", "Quantity", "Unit Price", "Total"));
        email.append("-----------------------------------------------------------\n");
        
        for (PurchaseOrderItem item : po.getItems()) {
            email.append(String.format("%-30s %10d $%14.2f $%14.2f\n",
                    item.getProduct().getName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getTotalPrice()));
        }
        
        email.append("-----------------------------------------------------------\n");
        email.append(String.format("%-30s %10s %15s $%14.2f\n", "", "", "TOTAL:", po.getTotalAmount()));
        email.append("-----------------------------------------------------------\n\n");
        
        if (po.getNotes() != null && !po.getNotes().isEmpty()) {
            email.append("Notes: ").append(po.getNotes()).append("\n\n");
        }
        
        email.append("Please confirm receipt and provide estimated delivery date.\n\n");
        email.append("Best Regards,\n");
        email.append("Inventory Management System");
        
        return email.toString();
    }

    private String buildAlertEmail(Alert alert) {
        StringBuilder email = new StringBuilder();
        
        email.append("Alert Notification\n\n");
        email.append("Type: ").append(alert.getAlertType()).append("\n");
        email.append("Severity: ").append(alert.getSeverity()).append("\n");
        email.append("Product: ").append(alert.getProduct().getName()).append("\n");
        email.append("Date: ").append(formatDate(alert.getCreatedAt())).append("\n\n");
        email.append("Message:\n");
        email.append(alert.getMessage()).append("\n\n");
        email.append("Please take appropriate action.\n\n");
        email.append("Best Regards,\n");
        email.append("Inventory Management System");
        
        return email.toString();
    }

    private String formatDate(Object dateTime) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return sdf.format(new Date());
    }
}