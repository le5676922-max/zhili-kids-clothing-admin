package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderVO {
    private String id;
    private String userId;
    private String sellerId;
    private BigDecimal totalAmount;
    private String status;
    private String statusText;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String remark;
    private String trackingNo;
    private LocalDateTime paidTime;
    private LocalDateTime shippedTime;
    private LocalDateTime completedTime;
    private LocalDateTime createdAt;
    private List<OrderItemVO> items;
}
