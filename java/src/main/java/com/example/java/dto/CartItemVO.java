package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 购物车项展示 VO（含产品信息）
 */
@Data
public class CartItemVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String productId;
    private String productName;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String selectedColor;
    private String selectedSize;
    private Integer quantity;
}
