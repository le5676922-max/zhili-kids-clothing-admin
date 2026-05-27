package com.example.java.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知列表项 VO
 */
@Data
public class NotificationVO {
    private Long id;
    private String userId;
    private String type;
    private String title;
    private String content;
    private Integer relatedId;
    private String relatedType;
    private String targetUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
