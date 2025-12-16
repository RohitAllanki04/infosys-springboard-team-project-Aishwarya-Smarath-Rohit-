package net.java.inventory_app.controller;

import net.java.inventory_app.entity.Transaction;
import net.java.inventory_app.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {

    private TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // Record Stock-In
    @PostMapping("/stock-in")
    public ResponseEntity<Map<String, Object>> recordStockIn(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long productId = Long.valueOf(request.get("productId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String handler = request.get("handler").toString();
            String notes = request.get("notes") != null ? request.get("notes").toString() : "";

            Transaction transaction = transactionService.recordStockIn(productId, quantity, handler, notes);
            
            response.put("success", true);
            response.put("message", "Stock-in recorded successfully");
            response.put("transaction", transaction);
            response.put("currentStock", transactionService.getCurrentStock(productId));
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // Record Stock-Out
    @PostMapping("/stock-out")
    public ResponseEntity<Map<String, Object>> recordStockOut(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long productId = Long.valueOf(request.get("productId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String handler = request.get("handler").toString();
            String notes = request.get("notes") != null ? request.get("notes").toString() : "";

            Transaction transaction = transactionService.recordStockOut(productId, quantity, handler, notes);
            
            response.put("success", true);
            response.put("message", "Stock-out recorded successfully");
            response.put("transaction", transaction);
            response.put("currentStock", transactionService.getCurrentStock(productId));
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // Get All Transactions
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    // Get Transactions by Product
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Transaction>> getTransactionsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(transactionService.getTransactionsByProduct(productId));
    }

    // Get Transaction by ID
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(transactionService.getTransactionById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get Current Stock of a Product
    @GetMapping("/stock/{productId}")
    public ResponseEntity<Map<String, Integer>> getCurrentStock(@PathVariable Long productId) {
        Map<String, Integer> response = new HashMap<>();
        try {
            Integer stock = transactionService.getCurrentStock(productId);
            response.put("currentStock", stock);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}