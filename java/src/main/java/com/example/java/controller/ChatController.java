package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.ChatContactVO;
import com.example.java.dto.ChatMessageVO;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.ChatMessagePushService;
import com.example.java.service.ChatMessageService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 招聘沟通 REST：联系人列表、聊天历史
 */
@RestController
@RequestMapping("/api/auth/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageService chatMessageService;
    private final ChatMessagePushService chatMessagePushService;
    private final UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new BusinessException("请先登录");
        }
        return user.getId();
    }

    @GetMapping("/contacts")
    public R<List<ChatContactVO>> contacts() {
        String userId = getCurrentUserId();
        List<ChatContactVO> list = chatMessageService.listContacts(userId);
        return R.success(list);
    }

    /** 未读消息数量（用于信息按钮红点） */
    @GetMapping("/unread-count")
    public R<Integer> unreadCount() {
        String userId = getCurrentUserId();
        int count = chatMessageService.getUnreadCount(userId);
        return R.success(count);
    }

    /** 将与某人的会话标记为已读 */
    @PostMapping("/mark-read")
    public R<Void> markRead(@RequestBody Map<String, Object> body) {
        String userId = getCurrentUserId();
        String otherUserId = body != null && body.get("otherUserId") != null
                ? body.get("otherUserId").toString() : null;
        Integer jobId = parseInteger(body, "jobId");
        Integer connectionId = parseInteger(body, "connectionId");
        if (otherUserId == null || otherUserId.isEmpty()) {
            return R.fail("缺少联系人");
        }
        chatMessageService.markAsRead(userId, otherUserId, jobId, connectionId);
        return R.success();
    }

    /**
     * 查询聊天历史
     * - 若传 connectionId，则按供需对接上下文查（其他人的消息可查）
     * - 若仅传 otherUserId(+jobId)，则按传统招聘聊天历史查
     */
    @GetMapping("/messages")
    public R<List<ChatMessageVO>> messages(
            @RequestParam String otherUserId,
            @RequestParam(required = false) Integer jobId,
            @RequestParam(required = false) Integer connectionId
    ) {
        String userId = getCurrentUserId();
        List<ChatMessageVO> list;
        if (connectionId != null) {
            list = chatMessageService.listByConnectionId(userId, connectionId);
        } else {
            list = chatMessageService.listHistory(userId, otherUserId, jobId, null);
        }
        return R.success(list);
    }

    /**
     * 发送消息（WebSocket 未连接时前端可走此接口）
     * 支持招聘场景(jobId)和企业供需对接场景(connectionId)，两者互斥
     */
    @PostMapping("/send")
    public R<ChatMessageVO> send(@RequestBody Map<String, Object> body) {
        String userId = getCurrentUserId();
        String toUserId = body != null && body.get("toUserId") != null
                ? body.get("toUserId").toString() : null;
        Integer jobId = parseInteger(body, "jobId");
        Integer connectionId = parseInteger(body, "connectionId");
        String content = body != null && body.get("content") != null
                ? body.get("content").toString() : "";
        if (connectionId != null) {
            ChatMessageVO vo = chatMessageService.send(userId, toUserId, null, connectionId, content);
            chatMessagePushService.pushToReceiver(vo);
            return R.success(vo);
        }
        ChatMessageVO vo = chatMessageService.send(userId, toUserId, jobId, null, content);
        chatMessagePushService.pushToReceiver(vo);
        return R.success(vo);
    }

    /**
     * 将某对接的所有消息标记为已读
     */
    @PostMapping("/mark-connection-read")
    public R<Void> markConnectionRead(@RequestBody Map<String, Object> body) {
        String userId = getCurrentUserId();
        Integer connectionId = parseInteger(body, "connectionId");
        if (connectionId == null) {
            return R.fail("缺少对接ID");
        }
        chatMessageService.markConnectionAsRead(userId, connectionId);
        return R.success();
    }

    private static Integer parseInteger(Map<String, Object> body, String key) {
        if (body == null || body.get(key) == null) {
            return null;
        }
        Object j = body.get(key);
        if (j instanceof Number) {
            return ((Number) j).intValue();
        }
        if (j instanceof String) {
            try {
                return Integer.parseInt(((String) j).trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
