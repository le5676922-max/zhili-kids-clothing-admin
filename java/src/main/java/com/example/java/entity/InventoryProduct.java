package com.example.java.entity;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class InventoryProduct implements Serializable {
    private static final long serialVersionUID = 1L;
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
    private Integer supplierId;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
