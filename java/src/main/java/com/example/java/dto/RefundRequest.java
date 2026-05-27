package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 退款申请请求DTO
 */
@Data
public class RefundRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 关联的订单ID */
    private String orderId;
    /** 退款类型：refund=仅退款, return=退货退款 */
    private String refundType;
    /** 退款原因 */
    private String reason;
    /** 退款说明 */
    private String description;
}
