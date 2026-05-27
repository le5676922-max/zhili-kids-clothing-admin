package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 产品实体，对应表 products
 */
@Data
public class Product implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String userId;
    private String name;
    private String description;
    private String category;
    private String ageRange;
    private String season;
    private String material;
    private String certification;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer sales;
    private String badge;
    private String imageUrl;
    private Integer status;
    private Integer stock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
