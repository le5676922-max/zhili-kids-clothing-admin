package com.example.java.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InventorySupplierVO {
    private Integer id;
    private String name;
    private String contactPerson;
    private String contactPhone;
    private String address;
    private Integer status;
    private Integer productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
