package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

/**
 * 发布需求请求DTO
 */
@Data
public class SupplyDemandCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // 基本信息
    private String title;
    private String type; // material, processing, design, accessory, logistics
    private String category;
    private String urgency; // high, medium, low

    // 企业信息
    private String companyName;
    private String contactName;
    private String contactPhone;
    private String email;
    private String location;

    // 需求描述
    private String description;

    // 规格要求（不同类型需求规格字段不同）
    private String specifications; // JSON字符串

    // 预算和截止日期
    private String budget;
    private LocalDate deadline;

    // 标签和要求
    private String tags; // 逗号分隔
    private String requirements; // 多行文本

    // 附件信息列表（包含文件名、URL、大小、类型等）
    private List<AttachmentInfo> attachments;
}
