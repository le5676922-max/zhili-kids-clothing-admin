package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class InventoryProductVO {
    private Integer id;
    private String productCode;
    private String name;
    private String spec;
    private String category;
    private String unit;
    private BigDecimal price;
    private Integer stock;
    private Integer minStock;
    private Integer warehouseId;
    private String warehouseName;
    private Integer supplierId;
    private String supplierName;
    private String remark;
    private Boolean lowStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
