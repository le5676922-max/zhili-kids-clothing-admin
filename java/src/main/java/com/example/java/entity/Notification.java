package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 站内通知实体
 */
@Data
public class Notification implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    /** 通知接收人用户ID */
    private String userId;
    /**
     * 通知类型：
     * supply_connection_created   = 收到对接申请
     * connection_status_changed  = 对接状态变更
     * job_application_received   = 收到简历投递
     */
    private String type;
    /** 通知标题 */
    private String title;
    /** 通知内容摘要 */
    private String content;
    /** 关联业务ID（对接记录ID或职位申请ID） */
    private Integer relatedId;
    /** 关联业务类型：connection / job_application */
    private String relatedType;
    /** 是否已读：0=未读，1=已读 */
    private Boolean isRead;
    /** 通知时间 */
    private LocalDateTime createdAt;
}
