package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InventoryInboundVO {
    private Integer id;
    private String recordNo;
    private LocalDate inboundDate;
    private Integer supplierId;
    private String supplierName;
    private Integer warehouseId;
    private String warehouseName;
    private List<InventoryItemVO> products;
    private BigDecimal totalAmount;
    private String status;
    private String operator;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
