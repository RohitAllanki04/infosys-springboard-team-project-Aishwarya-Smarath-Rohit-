package net.java.inventory_app.dto;

public class RestockRecommendation {

    private Long productId;
    private String productName;
    private Integer currentStock;
    private Integer recommendedQuantity;

    public RestockRecommendation() {}

    public RestockRecommendation(Long productId, String productName, Integer currentStock, Integer recommendedQuantity)
    {
        this.productId = productId;
        this.productName = productName;
        this.currentStock = currentStock;
        this.recommendedQuantity = recommendedQuantity;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }

    public Integer getRecommendedQuantity() { return recommendedQuantity; }
    public void setRecommendedQuantity(Integer recommendedQuantity) { this.recommendedQuantity = recommendedQuantity; 
    }
}



