package net.java.inventory_app.controller;

import net.java.inventory_app.entity.DemandForecast;
import net.java.inventory_app.service.AIForecastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forecasts")
@CrossOrigin(origins = "http://localhost:3000")
public class ForecastController {

    @Autowired
    private AIForecastService forecastService;

    // Generate forecast for a product
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateForecast(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long productId = Long.valueOf(request.get("productId").toString());
            String forecastType = request.getOrDefault("forecastType", "DAILY").toString();
            LocalDate forecastDate = LocalDate.parse(request.getOrDefault("forecastDate", LocalDate.now().plusDays(1).toString()).toString());
            
            DemandForecast forecast = forecastService.generateForecast(productId, forecastDate, forecastType);
            
            response.put("success", true);
            response.put("forecast", forecast);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Generate forecasts for all products
    @PostMapping("/generate-all")
    public ResponseEntity<Map<String, Object>> generateAllForecasts(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String forecastType = request.getOrDefault("forecastType", "DAILY");
            List<DemandForecast> forecasts = forecastService.generateAllForecasts(forecastType);
            
            response.put("success", true);
            response.put("count", forecasts.size());
            response.put("forecasts", forecasts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get all forecasts
    @GetMapping
    public ResponseEntity<List<DemandForecast>> getAllForecasts() {
        return ResponseEntity.ok(forecastService.getAllForecasts());
    }

    // Get stockout risks
    @GetMapping("/stockout-risks")
    public ResponseEntity<List<Map<String, Object>>> getStockoutRisks() {
        return ResponseEntity.ok(forecastService.getStockoutRisks());
    }

    // Predict demand for a product
    @GetMapping("/predict/{productId}")
    public ResponseEntity<Map<String, Object>> predictDemand(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int daysAhead) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer prediction = forecastService.predictDemand(productId, daysAhead);
            response.put("productId", productId);
            response.put("daysAhead", daysAhead);
            response.put("predictedDemand", prediction);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}