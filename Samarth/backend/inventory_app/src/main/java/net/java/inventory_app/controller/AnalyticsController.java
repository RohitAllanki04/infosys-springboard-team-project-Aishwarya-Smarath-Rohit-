// backend/src/main/java/net/java/inventory_app/controller/AnalyticsController.java
package net.java.inventory_app.controller;

import net.java.inventory_app.service.OrderService;
import net.java.inventory_app.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalyticsController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private ProductService productService;

    @GetMapping("/monthly-sales")
    public ResponseEntity<Map<String, Object>> getMonthlySales() {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> summary = orderService.getSalesSummary();
            response.put("success", true);
            response.put("data", summary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/inventory-trends")
    public ResponseEntity<Map<String, Object>> getInventoryTrends() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Implement inventory trends logic
            response.put("success", true);
            response.put("message", "Inventory trends data");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/top-restocked")
    public ResponseEntity<Map<String, Object>> getTopRestocked() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Implement top restocked items logic
            response.put("success", true);
            response.put("message", "Top restocked items data");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}