package com.example.java.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品评价实体
 */
@Data
public class ProductReview {
    private Integer id;
    private String orderId;          // 订单ID
    private Integer orderItemId;     // 订单项ID
    private String productId;        // 商品ID
    private String userId;           // 用户ID
    private Integer rating;          // 评分（1-5）
    private String content;          // 评价内容
    private String images;           // 评价图片（JSON数组）
    private String replyContent;     // 商家回复内容
    private LocalDateTime replyTime; // 商家回复时间
    private LocalDateTime createdAt; // 评价时间
    private LocalDateTime updatedAt; // 更新时间

    // 扩展字段
    private String userNickname;
    private String userAvatar;
    private String productName;
    private String productImage;
    private BigDecimal productPrice;
}
