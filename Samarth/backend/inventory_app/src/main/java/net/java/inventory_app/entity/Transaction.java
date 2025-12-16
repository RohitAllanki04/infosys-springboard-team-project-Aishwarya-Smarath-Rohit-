package net.java.inventory_app.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"transactions", "orderItems"})
    private Product product;

    @NotBlank(message = "Transaction type is required")
    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // "STOCK_IN" or "STOCK_OUT"

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    @Column(nullable = false)
    private Integer quantity;

    @NotBlank(message = "Handler name is required")
    @Column(nullable = false)
    private String handler;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 500)
    private String notes;

    // Default Constructor
    public Transaction() {
        this.timestamp = LocalDateTime.now();
    }

    // Parameterized Constructor
    public Transaction(Product product, String transactionType, Integer quantity, String handler, String notes) {
        this.product = product;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.handler = handler;
        this.notes = notes;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getHandler() {
        return handler;
    }

    public void setHandler(String handler) {
        this.handler = handler;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "id=" + id +
                ", product=" + (product != null ? product.getName() : "null") +
                ", transactionType='" + transactionType + '\'' +
                ", quantity=" + quantity +
                ", handler='" + handler + '\'' +
                ", timestamp=" + timestamp +
                ", notes='" + notes + '\'' +
                '}';
    }
}