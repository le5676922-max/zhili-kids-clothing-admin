package com.example.java.dto;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 我的发布供需项VO（包含本身信息 + 对接记录列表）
 */
@Data
public class MyPublishedItemVO implements Serializable {

    private static final long serialVersionUID = 1L;

    // ========== 本身信息 ==========
    private Integer id;               // 数据库主键ID
    private String itemId;           // 编号（如 DM20240101001）
    private String title;
    private String type;
    private String category;
    private String status;           // 需求/供应自身状态：open/inprocess/completed
    private String companyName;      // 发布企业名称
    private LocalDate publishDate;

    // ========== 对接统计 ==========
    private int totalConnections;    // 对接总数
    private int negotiatingCount;     // 洽谈中数量
    private int completedCount;      // 已完成数量

    // ========== 对接记录列表 ==========
    private List<ConnectionRecordVO> connections;

    /**
     * 对接记录VO（用于在我的发布项中展示）
     */
    @Data
    public static class ConnectionRecordVO implements Serializable {
        private static final long serialVersionUID = 1L;

        private Integer id;
        private String connectionId;
        private String status;        // negotiating / completed / cancelled
        private String startDate;
        private String lastUpdate;
        private String completedDate;
        private String notes;

        // 申请方信息（我发布的项被谁申请了）
        private String applicantUserId;
        private String applicantCompanyName;
        private String applicantContactName;
        private String applicantContactPhone;
        private String applicantContactEmail;

        private LocalDateTime createdAt;
    }
}
