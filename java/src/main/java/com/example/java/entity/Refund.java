package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 退款申请实体，对应表 refunds
 */
@Data
public class Refund implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    /** 退款单号 */
    private String refundNo;
    /** 关联的订单ID */
    private String orderId;
    /** 关联的用户ID（买家） */
    private String userId;
    /** 关联的企业ID（卖家） */
    private String sellerId;
    /** 退款金额 */
    private BigDecimal refundAmount;
    /** 退款类型：refund=仅退款, return=退货退款 */
    private String refundType;
    /** 退款原因 */
    private String reason;
    /** 退款说明 */
    private String description;
    /** 退款状态：pending=待审核, approved=审核通过, rejected=审核拒绝, completed=已完成, cancelled=已取消 */
    private String status;
    /** 商家处理备注 */
    private String sellerNote;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;
}
