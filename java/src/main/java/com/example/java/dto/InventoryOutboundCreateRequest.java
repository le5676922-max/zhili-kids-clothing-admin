package com.example.java.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class InventoryOutboundCreateRequest {
    private LocalDate outboundDate;
    private String type;
    private Integer warehouseId;
    private String targetName;
    private List<InventoryItemVO> products;
    private String operator;
    private String remark;
}
