package com.example.java.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** WebSocket 推送的招聘聊天消息体 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentChatMessage {
    private Long id;
    private String senderId;
    private String receiverId;
    private Integer jobId;
    /** 供需对接ID（非空表示企业间供需对接场景） */
    private Integer connectionId;
    /** 对接编号（仅 connectionId 非空时有值） */
    private String connectionCode;
    private String content;
    private String createdAt; // 格式化为前端可读
    private Boolean fromMe;   // 对接收方而言为 false
}
