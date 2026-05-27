package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 购物车项实体，对应表 cart
 */
@Data
public class Cart implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String userId;
    private String productId;
    private String selectedColor;
    private String selectedSize;
    private Integer quantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
