package com.example.java.service;

import com.example.java.dto.ChatMessageVO;
import com.example.java.dto.RecruitmentChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * 招聘聊天：向接收方 WebSocket 频道推送新消息（与 STOMP / REST 发送共用）
 */
@Service
@RequiredArgsConstructor
public class ChatMessagePushService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SimpMessagingTemplate messagingTemplate;

    /** 推送给接收方：/topic/chat/user/{receiverId} */
    public void pushToReceiver(ChatMessageVO saved) {
        if (saved == null || saved.getReceiverId() == null || saved.getReceiverId().isEmpty()) {
            return;
        }
        String timeStr = saved.getCreatedAt() != null ? saved.getCreatedAt().format(FMT) : null;
        RecruitmentChatMessage push = new RecruitmentChatMessage(
                saved.getId(),
                saved.getSenderId(),
                saved.getReceiverId(),
                saved.getJobId(),
                saved.getConnectionId(),
                saved.getConnectionCode(),
                saved.getContent(),
                timeStr,
                false
        );
        messagingTemplate.convertAndSend("/topic/chat/user/" + saved.getReceiverId(), push);
    }
}
