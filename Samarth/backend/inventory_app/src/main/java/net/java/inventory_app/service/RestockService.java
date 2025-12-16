package net.java.inventory_app.service;

import net.java.inventory_app.entity.PurchaseOrder;
import java.util.List;
import java.util.Map;

public interface RestockService {
    
    // Get AI-based restock recommendations
    List<Map<String, Object>> getRestockRecommendations();
    
    // Generate purchase order
    PurchaseOrder generatePurchaseOrder(List<Map<String, Object>> items, Long userId, Map<String, String> vendorInfo);
    
    // Get all purchase orders
    List<PurchaseOrder> getAllPurchaseOrders();
    
    // Get purchase order by ID
    PurchaseOrder getPurchaseOrderById(Long id);
    
    // Update purchase order status
    PurchaseOrder updatePurchaseOrderStatus(Long id, String status);
    
    // Send purchase order to vendor
    boolean sendPurchaseOrderToVendor(Long poId);
    
    // Get pending purchase orders
    List<PurchaseOrder> getPendingPurchaseOrders();
}