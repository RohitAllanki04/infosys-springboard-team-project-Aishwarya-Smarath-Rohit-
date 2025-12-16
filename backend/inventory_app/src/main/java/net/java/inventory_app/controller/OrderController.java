package net.java.inventory_app.controller;

import net.java.inventory_app.entity.Order;
import net.java.inventory_app.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {

    private OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Place Order
    @PostMapping("/place")
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            List<Map<String, Object>> cartItems = (List<Map<String, Object>>) request.get("cartItems");

            Order order = orderService.placeOrder(userId, cartItems);
            
            response.put("success", true);
            response.put("message", "Order placed successfully!");
            response.put("orderId", order.getId());
            response.put("totalAmount", order.getTotalAmount());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // Get All Orders (Admin only)
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // Get Orders by User
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    // Get Order by ID
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.getOrderById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get Sales Summary
    @GetMapping("/sales-summary")
    public ResponseEntity<Map<String, Object>> getSalesSummary() {
        return ResponseEntity.ok(orderService.getSalesSummary());
    }
}