package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;

/**
 * 工单消息实体，对应表 work_order_messages
 */
@Data
public class WorkOrderMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String orderId;
    private String role;
    private String content;
    private String time;
}
