package com.example.java.dto;

import lombok.Data;

/**
 * 创建工单请求
 */
@Data
public class WorkOrderCreateRequest {
    private String subject;
    private String content;
    private String level;
}
