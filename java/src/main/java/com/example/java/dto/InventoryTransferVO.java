package com.example.java.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InventoryTransferVO {
    private Integer id;
    private String recordNo;
    private LocalDate transferDate;
    private Integer fromWarehouseId;
    private String fromWarehouseName;
    private Integer toWarehouseId;
    private String toWarehouseName;
    private List<InventoryItemVO> products;
    private String reason;
    private String status;
    private String operator;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
