package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.*;
@Data
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String sku;

    private Integer reorderLevel;
    private Integer currentStock;
    private String category;

    // Many products can belong to one vendor
    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private User vendor;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<StockTransaction> stockTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<Purchase> purchaseOrders = new ArrayList<>();

    // Getters and Setters
    // (You can use Lombok @Data or manually write them)
}
