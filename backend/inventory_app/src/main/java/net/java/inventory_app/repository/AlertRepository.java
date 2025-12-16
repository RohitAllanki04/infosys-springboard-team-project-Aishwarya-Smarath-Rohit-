package net.java.inventory_app.repository;

import net.java.inventory_app.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByIsReadOrderByCreatedAtDesc(Boolean isRead);
    List<Alert> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<Alert> findByAlertTypeAndIsRead(String alertType, Boolean isRead);
    List<Alert> findBySeverityAndIsRead(String severity, Boolean isRead);
    List<Alert> findAllByOrderByCreatedAtDesc();
    Long countByIsRead(Boolean isRead);
}