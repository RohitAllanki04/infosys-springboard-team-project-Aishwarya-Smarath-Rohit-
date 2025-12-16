package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.*;
import net.java.inventory_app.repository.*;
import net.java.inventory_app.service.RestockService;
import net.java.inventory_app.service.NotificationService;
import net.java.inventory_app.service.AIForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RestockServiceImpl implements RestockService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;
    
    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AIForecastService forecastService;
    
    @Autowired
    private NotificationService notificationService;

    @Override
    public List<Map<String, Object>> getRestockRecommendations() {
        List<Product> products = productRepository.findAll();
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        for (Product product : products) {
            try {
                // Check if product needs restocking
                if (product.getCurrentStock() <= product.getReorderPoint()) {
                    Map<String, Object> recommendation = new HashMap<>();
                    
                    // Predict demand for next 30 days
                    Integer predictedDemand = forecastService.predictDemand(product.getId(), 30);
                    
                    // Calculate recommended order quantity
                    Integer recommendedQty = calculateReorderQuantity(product, predictedDemand);
                    
                    // Calculate urgency
                    String urgency = calculateUrgency(product, predictedDemand);
                    
                    // Calculate days until stockout
                    int daysUntilStockout = calculateDaysUntilStockout(product, predictedDemand);
                    
                    recommendation.put("productId", product.getId());
                    recommendation.put("productName", product.getName());
                    recommendation.put("currentStock", product.getCurrentStock());
                    recommendation.put("reorderPoint", product.getReorderPoint());
                    recommendation.put("recommendedQty", recommendedQty);
                    recommendation.put("predictedDemand", predictedDemand);
                    recommendation.put("daysUntilStockout", daysUntilStockout);
                    recommendation.put("urgency", urgency);
                    recommendation.put("estimatedCost", recommendedQty * product.getPrice());
                    recommendation.put("leadTimeDays", product.getLeadTimeDays());
                    
                    recommendations.add(recommendation);
                }
            } catch (Exception e) {
                System.err.println("Error generating recommendation for product " + product.getName() + ": " + e.getMessage());
            }
        }
        
        // Sort by urgency (critical first)
        recommendations.sort((a, b) -> {
            String urgencyA = (String) a.get("urgency");
            String urgencyB = (String) b.get("urgency");
            return getUrgencyPriority(urgencyA) - getUrgencyPriority(urgencyB);
        });
        
        return recommendations;
    }

    @Override
    @Transactional
    public PurchaseOrder generatePurchaseOrder(List<Map<String, Object>> items, Long userId, Map<String, String> vendorInfo) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create PO number
        String poNumber = generatePONumber();
        
        // Calculate total amount
        double totalAmount = 0.0;
        
        // Create Purchase Order
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(poNumber);
        po.setVendorName(vendorInfo.get("vendorName"));
        po.setVendorEmail(vendorInfo.get("vendorEmail"));
        po.setVendorPhone(vendorInfo.getOrDefault("vendorPhone", ""));
        po.setCreatedBy(user);
        po.setStatus("PENDING");
        po.setNotes(vendorInfo.getOrDefault("notes", "Auto-generated from restock recommendations"));
        
        po = purchaseOrderRepository.save(po);
        
        // Create PO Items
        for (Map<String, Object> item : items) {
            Long productId = Long.valueOf(item.get("productId").toString());
            Integer quantity = Integer.valueOf(item.get("quantity").toString());
            
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
            
            Double unitPrice = product.getPrice();
            Double itemTotal = unitPrice * quantity;
            
            PurchaseOrderItem poItem = new PurchaseOrderItem(po, product, quantity, unitPrice);
            purchaseOrderItemRepository.save(poItem);
            
            totalAmount += itemTotal;
        }
        
        po.setTotalAmount(totalAmount);
        return purchaseOrderRepository.save(po);
    }

    @Override
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));
    }

    @Override
    @Transactional
    public PurchaseOrder updatePurchaseOrderStatus(Long id, String status) {
        PurchaseOrder po = getPurchaseOrderById(id);
        po.setStatus(status);
        
        if (status.equals("SENT")) {
            po.setSentAt(LocalDateTime.now());
        } else if (status.equals("APPROVED")) {
            po.setApprovedAt(LocalDateTime.now());
        }
        
        return purchaseOrderRepository.save(po);
    }

    @Override
    public boolean sendPurchaseOrderToVendor(Long poId) {
        try {
            PurchaseOrder po = getPurchaseOrderById(poId);
            
            // Send email notification
            boolean emailSent = notificationService.sendPurchaseOrderEmail(po);
            
            if (emailSent) {
                updatePurchaseOrderStatus(poId, "SENT");
                return true;
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Error sending PO to vendor: " + e.getMessage());
            return false;
        }
    }

    @Override
    public List<PurchaseOrder> getPendingPurchaseOrders() {
        return purchaseOrderRepository.findByStatus("PENDING");
    }

    // Helper Methods
    private Integer calculateReorderQuantity(Product product, Integer predictedDemand) {
        // Economic Order Quantity (EOQ) approach
        int leadTimeDemand = (int) Math.ceil((predictedDemand / 30.0) * product.getLeadTimeDays());
        int safetyStock = (int) Math.ceil((predictedDemand / 30.0) * 7); // 7 days safety stock
        int reorderQty = leadTimeDemand + safetyStock - product.getCurrentStock();
        
        // Use configured reorder quantity if available
        if (product.getReorderQuantity() != null && product.getReorderQuantity() > 0) {
            reorderQty = Math.max(reorderQty, product.getReorderQuantity());
        }
        
        return Math.max(reorderQty, 10); // Minimum 10 units
    }

    private String calculateUrgency(Product product, Integer predictedDemand) {
        int daysUntilStockout = calculateDaysUntilStockout(product, predictedDemand);
        
        if (daysUntilStockout <= 3) return "CRITICAL";
        if (daysUntilStockout <= 7) return "HIGH";
        if (daysUntilStockout <= 14) return "MEDIUM";
        return "LOW";
    }

    private int calculateDaysUntilStockout(Product product, Integer predictedDemand) {
        double dailyDemand = predictedDemand / 30.0;
        if (dailyDemand == 0) return 999;
        return (int) Math.floor(product.getCurrentStock() / dailyDemand);
    }

    private int getUrgencyPriority(String urgency) {
        switch (urgency) {
            case "CRITICAL": return 0;
            case "HIGH": return 1;
            case "MEDIUM": return 2;
            case "LOW": return 3;
            default: return 4;
        }
    }

    private String generatePONumber() {
        String prefix = "PO";
        String datePart = LocalDate.now().toString().replace("-", "");
        long count = purchaseOrderRepository.count() + 1;
        return String.format("%s-%s-%04d", prefix, datePart, count);
    }
}