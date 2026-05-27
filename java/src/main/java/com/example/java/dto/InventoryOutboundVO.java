package com.example.java.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InventoryOutboundVO {
    private Integer id;
    private String recordNo;
    private LocalDate outboundDate;
    private String type;
    private Integer warehouseId;
    private String warehouseName;
    private String targetName;
    private List<InventoryItemVO> products;
    private String status;
    private String operator;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
