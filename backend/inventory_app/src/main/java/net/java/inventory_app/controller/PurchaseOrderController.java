package net.java.inventory_app.controller;

import net.java.inventory_app.entity.PurchaseOrder;
import net.java.inventory_app.service.RestockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseOrderController {

    @Autowired
    private RestockService restockService;

    // Get all purchase orders
    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders() {
        return ResponseEntity.ok(restockService.getAllPurchaseOrders());
    }

    // Get purchase order by ID
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(restockService.getPurchaseOrderById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Create new purchase order
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPurchaseOrder(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("items");
            Long userId = Long.valueOf(request.get("userId").toString());
            Map<String, String> vendorInfo = (Map<String, String>) request.get("vendorInfo");
            
            PurchaseOrder po = restockService.generatePurchaseOrder(items, userId, vendorInfo);
            
            response.put("success", true);
            response.put("message", "Purchase order created successfully");
            response.put("purchaseOrder", po);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Update purchase order status
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String status = request.get("status");
            PurchaseOrder po = restockService.updatePurchaseOrderStatus(id, status);
            
            response.put("success", true);
            response.put("message", "Status updated successfully");
            response.put("purchaseOrder", po);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Send purchase order to vendor
    @PostMapping("/{id}/send")
    public ResponseEntity<Map<String, Object>> sendToVendor(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean sent = restockService.sendPurchaseOrderToVendor(id);
            
            if (sent) {
                response.put("success", true);
                response.put("message", "Purchase order sent to vendor successfully");
            } else {
                response.put("success", false);
                response.put("message", "Failed to send purchase order");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get pending purchase orders
    @GetMapping("/pending")
    public ResponseEntity<List<PurchaseOrder>> getPendingPurchaseOrders() {
        return ResponseEntity.ok(restockService.getPendingPurchaseOrders());
    }

    // Approve purchase order
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approvePurchaseOrder(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            PurchaseOrder po = restockService.updatePurchaseOrderStatus(id, "APPROVED");
            response.put("success", true);
            response.put("message", "Purchase order approved");
            response.put("purchaseOrder", po);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Cancel/Reject purchase order
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelPurchaseOrder(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            PurchaseOrder po = restockService.updatePurchaseOrderStatus(id, "REJECTED");
            response.put("success", true);
            response.put("message", "Purchase order cancelled");
            response.put("purchaseOrder", po);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Delete purchase order
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePurchaseOrder(@PathVariable Long id) {
        Map<String, String> response = new HashMap<>();
        try {
            // Implementation depends on your business logic
            // For now, just return success
            response.put("message", "Purchase order deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }}