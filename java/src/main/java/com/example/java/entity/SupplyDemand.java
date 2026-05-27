package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 需求信息实体，对应表 supply_demands
 */
@Data
public class SupplyDemand implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String demandId;
    private String title;
    private String type; // material, processing, design, accessory, logistics
    private String category;
    private String urgency; // high, medium, low
    private String status; // open, inprocess, completed
    private String userId;
    private String companyName;
    private String contactName;
    private String contactPhone;
    private String email;
    private String location;
    private String description;
    private String specifications; // JSON格式
    private String budget;
    private LocalDate deadline;
    private LocalDate publishDate;
    private String tags;
    private String requirements;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
