package net.java.inventory_app.repository;

import net.java.inventory_app.entity.VendorResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VendorResponseRepository extends JpaRepository<VendorResponse, Long> {
    List<VendorResponse> findByPurchaseOrderId(Long poId);
    Optional<VendorResponse> findByPurchaseOrderIdAndResponseStatus(Long poId, String status);
    List<VendorResponse> findByResponseStatus(String status);
}