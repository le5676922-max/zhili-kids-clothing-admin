package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InventoryProductCreateRequest {
    private String productCode;
    private String name;
    private String spec;
    private String category;
    private String unit;
    private BigDecimal price;
    private Integer stock;
    private Integer minStock;
    private Integer warehouseId;
    private Integer supplierId;
    private String remark;
}
