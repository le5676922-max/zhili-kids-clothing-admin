package com.example.java.dto;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 对接记录VO（包含关联的需求/供应简要信息）
 */
@Data
public class SupplyConnectionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String connectionId;
    private Integer demandId;
    private Integer supplyId;
    private String status;
    private LocalDate startDate;
    private LocalDate lastUpdate;
    private LocalDate completedDate;
    private String notes;
    private String applicantUserId;
    private String applicantCompanyName;
    private String applicantContactName;
    private String applicantContactPhone;
    private String applicantContactEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 关联的需求简要信息（用于展示）
    private String demandTitle;
    private String demandType;
    private String demandCategory;
    private String demandCompanyName;
    private String demandStatus;
    private String demandUserId;

    // 关联的供应简要信息（用于展示）
    private String supplyTitle;
    private String supplyType;
    private String supplyCategory;
    private String supplyCompanyName;
    private String supplyStatus;
    private String supplyUserId;
}
