package com.example.java.entity;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class InventoryTransferRecord implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String recordNo;
    private LocalDate transferDate;
    private Integer fromWarehouseId;
    private Integer toWarehouseId;
    private String products;
    private String reason;
    private String status;
    private String operator;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
