package com.example.java.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 单条聊天记录（含是否为自己发送） */
@Data
public class ChatMessageVO {
    private Long id;
    private String senderId;
    private String receiverId;
    private Integer jobId;
    /** 关联供需对接ID（企业间对接沟通） */
    private Integer connectionId;
    private String content;
    private LocalDateTime createdAt;
    private Boolean fromMe;
    /** 关联对接编号（仅 connectionId 非空时有值，用于前端展示） */
    private String connectionCode;
}
