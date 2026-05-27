package com.example.java.entity;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class InventoryWarehouse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String name;
    private String address;
    private String manager;
    private String contactPhone;
    private Integer capacity;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
