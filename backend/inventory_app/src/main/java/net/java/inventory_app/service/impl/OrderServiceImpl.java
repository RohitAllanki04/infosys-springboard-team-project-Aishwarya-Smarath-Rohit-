package net.java.inventory_app.service.impl;

import net.java.inventory_app.entity.Order;
import net.java.inventory_app.entity.OrderItem;
import net.java.inventory_app.entity.Product;
import net.java.inventory_app.entity.User;
import net.java.inventory_app.repository.OrderRepository;
import net.java.inventory_app.repository.OrderItemRepository;
import net.java.inventory_app.repository.ProductRepository;
import net.java.inventory_app.repository.UserRepository;
import net.java.inventory_app.service.OrderService;
import net.java.inventory_app.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderServiceImpl implements OrderService {

    private OrderRepository orderRepository;
    private OrderItemRepository orderItemRepository;
    private ProductRepository productRepository;
    private UserRepository userRepository;
    private TransactionService transactionService;

    @Autowired
    public OrderServiceImpl(OrderRepository orderRepository, 
                           OrderItemRepository orderItemRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository,
                           TransactionService transactionService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.transactionService = transactionService;
    }

    @Override
    @Transactional
    public Order placeOrder(Long userId, List<Map<String, Object>> cartItems) {
        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Validate cart not empty
        if (cartItems == null || cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Calculate total and validate stock
        double totalAmount = 0.0;
        for (Map<String, Object> item : cartItems) {
            Long productId = Long.valueOf(item.get("productId").toString());
            Integer quantity = Integer.valueOf(item.get("quantity").toString());

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

            // Check stock availability
            if (product.getCurrentStock() < quantity) {
                throw new RuntimeException("Insufficient stock for " + product.getName() + 
                        ". Available: " + product.getCurrentStock() + ", Requested: " + quantity);
            }

            totalAmount += product.getPrice() * quantity;
        }

        // Create order
        Order order = new Order(user, totalAmount);
        order = orderRepository.save(order);

        // Process each item
        for (Map<String, Object> item : cartItems) {
            Long productId = Long.valueOf(item.get("productId").toString());
            Integer quantity = Integer.valueOf(item.get("quantity").toString());

            Product product = productRepository.findById(productId).get();

            // Create order item
            OrderItem orderItem = new OrderItem(order, product, quantity, product.getPrice());
            orderItemRepository.save(orderItem);

            // Record stock-out transaction
            transactionService.recordStockOut(
                productId, 
                quantity, 
                "System - User Purchase by " + user.getFullName(),
                "Order #" + order.getId()
            );

            // Update purchase count
            product.setPurchaseCount(product.getPurchaseCount() + quantity);
            productRepository.save(product);
        }

        return order;
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    @Override
    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    @Override
    public Map<String, Object> getSalesSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        Long ordersToday = orderRepository.countOrdersToday();
        Double revenueToday = orderRepository.sumRevenueToday();
        Long ordersThisMonth = orderRepository.countOrdersThisMonth();
        Double revenueThisMonth = orderRepository.sumRevenueThisMonth();
        
        System.out.println("=== SALES SUMMARY DEBUG ===");
        System.out.println("Orders Today: " + ordersToday);
        System.out.println("Revenue Today: " + revenueToday);
        System.out.println("Orders This Month: " + ordersThisMonth);
        System.out.println("Revenue This Month: " + revenueThisMonth);
        System.out.println("===========================");
        
        summary.put("ordersToday", ordersToday != null ? ordersToday : 0);
        summary.put("revenueToday", revenueToday != null ? revenueToday : 0.0);
        summary.put("ordersThisMonth", ordersThisMonth != null ? ordersThisMonth : 0);
        summary.put("revenueThisMonth", revenueThisMonth != null ? revenueThisMonth : 0.0);
        
        return summary;
    }
}