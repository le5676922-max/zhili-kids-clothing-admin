package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InventoryItemVO {
    private Integer productId;
    private String productCode;
    private String productName;
    private String productSpec;
    private String unit;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal amount;
}
