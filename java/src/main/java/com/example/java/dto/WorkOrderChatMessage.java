package com.example.java.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 工单聊天 WebSocket 推送消息体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderChatMessage {
    /** 发送者角色：user / admin */
    private String role;
    /** 消息内容 */
    private String content;
    /** 发送时间 */
    private String time;
}
