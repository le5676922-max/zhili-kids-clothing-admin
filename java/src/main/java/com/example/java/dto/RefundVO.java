package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 退款申请VO
 */
@Data
public class RefundVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    /** 退款单号 */
    private String refundNo;
    /** 关联的订单ID */
    private String orderId;
    /** 关联的用户ID（买家） */
    private String userId;
    /** 买家昵称 */
    private String userNickname;
    /** 关联的企业ID（卖家） */
    private String sellerId;
    /** 卖家企业名称 */
    private String sellerName;
    /** 退款金额 */
    private BigDecimal refundAmount;
    /** 退款类型：refund=仅退款, return=退货退款 */
    private String refundType;
    /** 退款原因 */
    private String reason;
    /** 退款说明 */
    private String description;
    /** 退款状态 */
    private String status;
    /** 商家处理备注 */
    private String sellerNote;
    /** 退款状态文本 */
    private String statusText;
    /** 订单总金额 */
    private BigDecimal orderAmount;
    /** 订单状态 */
    private String orderStatus;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;
}
