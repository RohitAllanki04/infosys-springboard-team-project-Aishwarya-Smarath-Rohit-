package net.java.inventory_app.controller;

import net.java.inventory_app.entity.Alert;
import net.java.inventory_app.entity.Product;
import net.java.inventory_app.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:3000")
public class AlertController {

    @Autowired
    private AlertService alertService;

    // Get all alerts
    @GetMapping
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    // Get unread alerts
    @GetMapping("/unread")
    public ResponseEntity<List<Alert>> getUnreadAlerts() {
        return ResponseEntity.ok(alertService.getUnreadAlerts());
    }

    // Mark alert as read
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Alert alert = alertService.markAsRead(id);
            response.put("success", true);
            response.put("alert", alert);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get alerts by type
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Alert>> getAlertsByType(@PathVariable String type) {
        return ResponseEntity.ok(alertService.getAlertsByType(type));
    }

    // Get alerts by severity
    @GetMapping("/severity/{severity}")
    public ResponseEntity<List<Alert>> getAlertsBySeverity(@PathVariable String severity) {
        return ResponseEntity.ok(alertService.getAlertsBySeverity(severity));
    }

    // Count unread alerts
    @GetMapping("/count/unread")
    public ResponseEntity<Map<String, Long>> countUnreadAlerts() {
        Map<String, Long> response = new HashMap<>();
        response.put("count", alertService.countUnreadAlerts());
        return ResponseEntity.ok(response);
    }

    // Trigger alert check for all products
    @PostMapping("/check-all")
    public ResponseEntity<Map<String, Object>> checkAllAlerts() {
        Map<String, Object> response = new HashMap<>();
        try {
            alertService.checkAndCreateAlerts();
            response.put("success", true);
            response.put("message", "Alert check completed");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
  }