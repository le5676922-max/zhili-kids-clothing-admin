package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 招聘沟通聊天记录
 */
@Data
public class ChatMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String senderId;
    private String receiverId;
    /** 关联职位ID（招聘场景） */
    private Integer jobId;
    /** 关联供需对接ID（企业间对接场景） */
    private Integer connectionId;
    private String content;
    private LocalDateTime createdAt;
    /** 接收方阅读时间，null 表示未读 */
    private LocalDateTime readAt;
}
