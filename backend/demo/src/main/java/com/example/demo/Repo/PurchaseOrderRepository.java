package com.example.demo.Repo;

import com.example.demo.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Purchase Orders
@Repository
public interface PurchaseOrderRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByVendorId(Long vendorId);
}
