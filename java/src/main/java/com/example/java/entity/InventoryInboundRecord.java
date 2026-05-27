package com.example.java.entity;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class InventoryInboundRecord implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String recordNo;
    private LocalDate inboundDate;
    private Integer supplierId;
    private Integer warehouseId;
    private String products;
    private BigDecimal totalAmount;
    private String status;
    private String operator;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
