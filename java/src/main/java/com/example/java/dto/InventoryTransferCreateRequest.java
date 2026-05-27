package com.example.java.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class InventoryTransferCreateRequest {
    private LocalDate transferDate;
    private Integer fromWarehouseId;
    private Integer toWarehouseId;
    private List<InventoryItemVO> products;
    private String reason;
    private String operator;
    private String remark;
}
