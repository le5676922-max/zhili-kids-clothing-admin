package com.example.java.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InventoryWarehouseVO {
    private Integer id;
    private String name;
    private String address;
    private String manager;
    private String contactPhone;
    private Integer capacity;
    private Integer status;
    private Integer productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
