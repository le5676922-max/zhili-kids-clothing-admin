package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 发布供应请求DTO
 */
@Data
public class SupplySupplyCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // 基本信息
    private String title;
    private String type; // material, processing, design, accessory, logistics
    private String category;

    // 企业信息
    private String companyName;
    private String contactName;
    private String contactPhone;
    private String email;
    private String location;

    // 供应描述
    private String description;

    // 规格说明（不同类型供应规格字段不同）
    private String specifications; // JSON字符串

    // 价格和产能
    private String price;
    private String capacity;

    // 标签、优势和认证
    private String tags; // 逗号分隔
    private String advantages; // 多行文本
    private String certifications; // 逗号分隔

    // 附件信息列表（包含文件名、URL、大小、类型等）
    private List<AttachmentInfo> attachments;
}
