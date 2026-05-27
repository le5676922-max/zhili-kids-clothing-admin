package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 需求信息VO（包含附件列表）
 */
@Data
public class SupplyDemandVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String demandId;
    private String title;
    private String type;
    private String category;
    private String urgency;
    private String status;
    private String userId;
    private String companyName;
    private String contactName;
    private String contactPhone;
    private String email;
    private String location;
    private String description;
    private String specifications;
    private String budget;
    private LocalDate deadline;
    private LocalDate publishDate;
    private String tags;
    private String requirements;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 附件列表
    private List<SupplyAttachmentVO> attachments;
}
