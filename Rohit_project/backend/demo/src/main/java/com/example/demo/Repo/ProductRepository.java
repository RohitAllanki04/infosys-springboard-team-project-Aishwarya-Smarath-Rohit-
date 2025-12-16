package com.example.demo.Repo;

import com.example.demo.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);  // ✅ Needed for SKU validation

    // Optional<Product> findBySku(String sku);  // (Optional is better, but optional)

    List<Product> findByVendorId(Long vendorId);  // keep as is, just rename param
}
