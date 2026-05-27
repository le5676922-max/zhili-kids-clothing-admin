package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class InventoryInboundCreateRequest {
    private LocalDate inboundDate;
    private Integer supplierId;
    private Integer warehouseId;
    private List<InventoryItemVO> products;
    private BigDecimal totalAmount;
    private String operator;
    private String remark;
}
