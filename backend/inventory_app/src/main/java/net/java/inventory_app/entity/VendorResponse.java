package net.java.inventory_app.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_responses")
public class VendorResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "po_id", nullable = false)
    @JsonIgnoreProperties({"items"})
    private PurchaseOrder purchaseOrder;

    @Column(name = "response_status", nullable = false)
    private String responseStatus; // APPROVED, REJECTED, MODIFIED

    @Column(name = "response_date", nullable = false)
    private LocalDateTime responseDate;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    // Constructors
    public VendorResponse() {
        this.responseDate = LocalDateTime.now();
    }

    public VendorResponse(PurchaseOrder purchaseOrder, String responseStatus, String comments, LocalDate expectedDeliveryDate) {
        this.purchaseOrder = purchaseOrder;
        this.responseStatus = responseStatus;
        this.comments = comments;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.responseDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(PurchaseOrder purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
    }

    public String getResponseStatus() {
        return responseStatus;
    }

    public void setResponseStatus(String responseStatus) {
        this.responseStatus = responseStatus;
    }

    public LocalDateTime getResponseDate() {
        return responseDate;
    }

    public void setResponseDate(LocalDateTime responseDate) {
        this.responseDate = responseDate;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }
}