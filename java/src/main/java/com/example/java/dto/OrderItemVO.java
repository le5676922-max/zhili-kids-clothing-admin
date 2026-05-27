package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemVO {
    private Integer id;
    private String productId;
    private String productName;
    private String productImage;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
    private String selectedColor;
    private String selectedSize;
}
