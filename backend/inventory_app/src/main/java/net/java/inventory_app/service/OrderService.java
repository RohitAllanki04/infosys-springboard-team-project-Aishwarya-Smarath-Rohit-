package net.java.inventory_app.service;

import net.java.inventory_app.entity.Order;
import java.util.List;
import java.util.Map;

public interface OrderService {
    
    // Place a new order
    Order placeOrder(Long userId, List<Map<String, Object>> cartItems);
    
    // Get all orders
    List<Order> getAllOrders();
    
    // Get orders by user
    List<Order> getOrdersByUser(Long userId);
    
    // Get order by ID
    Order getOrderById(Long id);
    
    // Get sales summary
    Map<String, Object> getSalesSummary();
}