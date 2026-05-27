package com.example.java.entity;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class InventorySupplier implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String name;
    private String contactPerson;
    private String contactPhone;
    private String address;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
