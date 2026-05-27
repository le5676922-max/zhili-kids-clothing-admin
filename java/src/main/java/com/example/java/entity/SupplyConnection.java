package com.example.java.entity;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 供需对接记录实体，对应表 supply_connections
 */
@Data
public class SupplyConnection {

    private Integer id;
    
    /** 对接编号（如CN20240101001） */
    private String connectionId;
    
    /** 需求ID */
    private Integer demandId;
    
    /** 供应ID */
    private Integer supplyId;

    /** 需求发布者用户ID */
    private String demandUserId;

    /** 供应发布者用户ID */
    private String supplyUserId;

    /** 对接状态：negotiating=洽谈中, completed=已完成, cancelled=已取消 */
    private String status;
    
    /** 开始日期 */
    private LocalDate startDate;
    
    /** 最后更新日期 */
    private LocalDate lastUpdate;
    
    /** 完成日期 */
    private LocalDate completedDate;
    
    /** 备注说明 */
    private String notes;
    
    /** 申请对接的用户ID */
    private String applicantUserId;
    
    /** 申请企业名称 */
    private String applicantCompanyName;
    
    /** 申请联系人 */
    private String applicantContactName;
    
    /** 申请联系人电话 */
    private String applicantContactPhone;
    
    /** 申请联系人邮箱 */
    private String applicantContactEmail;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
