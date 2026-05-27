package com.example.java.controller;

import com.example.java.dto.WorkOrderChatMessage;
import com.example.java.dto.WorkOrderReplyRequest;
import com.example.java.exception.BusinessException;
import com.example.java.security.WorkOrderWebSocketPrincipal;
import com.example.java.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * 工单聊天 WebSocket 控制器：接收发送消息并广播到对应工单频道
 */
@Controller
@RequiredArgsConstructor
public class WorkOrderChatController {

    private final WorkOrderService workOrderService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 发送工单回复：先落库再广播到 /topic/work-order/{orderId}
     */
    @MessageMapping("/work-order/{orderId}/send")
    public void sendReply(
            @DestinationVariable String orderId,
            @Payload Map<String, String> payload,
            Principal principal
    ) {
        if (principal == null || !(principal instanceof WorkOrderWebSocketPrincipal)) {
            throw new BusinessException(401, "请先登录");
        }
        WorkOrderWebSocketPrincipal wp = (WorkOrderWebSocketPrincipal) principal;
        String content = payload != null ? payload.get("content") : null;
        if (content == null) content = "";
        content = content.trim();
        if (content.isEmpty()) {
            throw new BusinessException(400, "请填写回复内容");
        }
        WorkOrderReplyRequest request = new WorkOrderReplyRequest();
        request.setContent(content);
        Map<String, String> result = workOrderService.reply(
                orderId,
                wp.getUserId(),
                wp.isAdmin(),
                request
        );
        String role = wp.isAdmin() ? "admin" : "user";
        String time = result != null ? result.get("time") : null;
        if (time == null) time = java.time.LocalDateTime.now().toString();
        WorkOrderChatMessage msg = new WorkOrderChatMessage(role, content, time);
        messagingTemplate.convertAndSend("/topic/work-order/" + orderId, msg);
    }
}
