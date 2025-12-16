package net.java.inventory_app.controller;

import net.java.inventory_app.dto.RestockRecommendation;
import net.java.inventory_app.service.RestockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restock")
@CrossOrigin(origins = "http://localhost:3000")
public class RestockController {

    @Autowired
    private RestockService restockService;

    @GetMapping
    public List<Map<String, Object>> getRestockRecommendations() {
        return restockService.getRestockRecommendations();
    }
}