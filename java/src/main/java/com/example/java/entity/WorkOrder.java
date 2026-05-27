package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 工单实体，对应表 work_orders
 */
@Data
public class WorkOrder implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String userId;
    private String subject;
    private String content;
    private String level;
    private String status;
    private String createTime;
    private String lastReply;

    /** 工单详情接口返回的回复列表，不持久化 */
    private List<WorkOrderMessage> messages;
}
