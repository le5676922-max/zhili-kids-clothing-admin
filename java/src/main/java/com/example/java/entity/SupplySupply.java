package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 供应信息实体，对应表 supply_supplies
 */
@Data
public class SupplySupply implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String supplyId;
    private String title;
    private String type; // material, processing, design, accessory, logistics
    private String category;
    private String status; // available
    private String userId;
    private String companyName;
    private String contactName;
    private String contactPhone;
    private String email;
    private String location;
    private String description;
    private String specifications; // JSON格式
    private String price;
    private String capacity;
    private LocalDate publishDate;
    private String tags;
    private String advantages;
    private String certifications;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
