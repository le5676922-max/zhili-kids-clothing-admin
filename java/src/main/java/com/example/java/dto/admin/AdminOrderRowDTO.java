package com.example.java.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 管理端订单列表一行（按订单项展开：买家、卖家、商品）
 */
@Data
public class AdminOrderRowDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String orderId;
    private String orderStatus;
    private String orderStatusText;
    private LocalDateTime createdAt;
    private String buyerName;
    private String buyerEmail;
    private String sellerName;
    private String productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
}
