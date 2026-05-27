package com.example.java.controller;

import com.example.java.dto.ChatMessageVO;
import com.example.java.exception.BusinessException;
import com.example.java.security.WorkOrderWebSocketPrincipal;
import com.example.java.service.ChatMessagePushService;
import com.example.java.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * 招聘沟通 WebSocket：发送消息落库并推送给对方
 */
@Controller
@RequiredArgsConstructor
public class RecruitmentChatController {

    private final ChatMessageService chatMessageService;
    private final ChatMessagePushService chatMessagePushService;

    @MessageMapping("/chat/send")
    public void send(@Payload Map<String, Object> payload, Principal principal) {
        // STOMP 会话里 setUser 的是 WorkOrderWebSocketPrincipal；部分环境下具体类型无法自动绑定，需从 Principal 强转
        if (principal == null || !(principal instanceof WorkOrderWebSocketPrincipal)) {
            throw new BusinessException(401, "请先登录");
        }
        WorkOrderWebSocketPrincipal p = (WorkOrderWebSocketPrincipal) principal;
        String senderId = p.getUserId();
        String toUserId = payload != null && payload.get("toUserId") != null ? payload.get("toUserId").toString() : null;
        if (toUserId == null || toUserId.isEmpty()) {
            throw new BusinessException(400, "接收人不能为空");
        }
        String content = payload != null && payload.get("content") != null ? payload.get("content").toString() : "";
        if (content.trim().isEmpty()) {
            throw new BusinessException(400, "消息内容不能为空");
        }
        Integer jobId = parseJobId(payload);
        ChatMessageVO saved = chatMessageService.send(senderId, toUserId, jobId, null, content);
        // 只推送给接收方；发送方已在 job-info.js 中乐观更新 UI
        chatMessagePushService.pushToReceiver(saved);
    }

    private static Integer parseJobId(Map<String, Object> payload) {
        if (payload == null || payload.get("jobId") == null) {
            return null;
        }
        Object j = payload.get("jobId");
        if (j instanceof Number) {
            return ((Number) j).intValue();
        }
        if (j instanceof String) {
            try {
                return Integer.parseInt(((String) j).trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
