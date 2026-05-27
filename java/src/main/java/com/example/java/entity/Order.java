package com.example.java.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Order {
    private String id;
    private String userId;
    private BigDecimal totalAmount;
    private String status;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String remark;
    private String trackingNo;
    private LocalDateTime paidTime;
    private LocalDateTime shippedTime;
    private LocalDateTime completedTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
