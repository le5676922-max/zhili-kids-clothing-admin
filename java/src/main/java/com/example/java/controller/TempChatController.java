package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.UserMapper;
import com.example.java.service.TempSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 临时会话 REST API - 实现闲鱼式临时对话
 * 
 * 功能：
 * 1. 会话管理 - 创建/查询/关闭会话
 * 2. 在线状态 - 用户上下线/心跳
 * 3. 消息路由 - 在线推送/离线存储
 * 4. 黑名单 - 防骚扰控制
 */
@RestController
@RequestMapping("/api/auth/temp-chat")
@RequiredArgsConstructor
public class TempChatController {

    private final TempSessionService tempSessionService;
    private final UserMapper userMapper;

    /**
     * 获取当前登录用户ID
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new BusinessException("请先登录");
        }
        return user.getId();
    }

    /** Redis Hash 的 key 为 Object，转为 JSON 友好的 String key */
    private static Map<String, Object> toStringKeyMap(Map<Object, Object> raw) {
        Map<String, Object> m = new HashMap<>();
        if (raw != null) {
            raw.forEach((k, v) -> m.put(String.valueOf(k), v));
        }
        return m;
    }

    // ==================== 会话管理 ====================

    /**
     * 创建或获取会话
     * 
     * 请求体：
     * {
     *   "otherUserId": "卖家/买家ID",
     *   "productId": "商品/供需ID",
     *   "productType": "product|connection|order|job",
     *   "productTitle": "商品标题"
     * }
     */
    @PostMapping("/sessions")
    public R<Map<String, Object>> createOrGetSession(@RequestBody Map<String, Object> request) {
        String userId = getCurrentUserId();
        String otherUserId = (String) request.get("otherUserId");
        String productId = (String) request.get("productId");
        String productType = (String) request.get("productType");
        String productTitle = (String) request.get("productTitle");

        if (otherUserId == null || otherUserId.isBlank()) {
            return R.fail("缺少对方用户ID");
        }
        if (productId == null || productId.isBlank()) {
            return R.fail("缺少商品ID");
        }
        if (productType == null || productType.isBlank()) {
            return R.fail("缺少会话类型");
        }

        // 检查黑名单
        if (tempSessionService.isInBlacklist(userId, otherUserId) || 
            tempSessionService.isInBlacklist(otherUserId, userId)) {
            return R.fail("无法与该用户发起会话");
        }

        // 创建或获取会话
        String sessionId = tempSessionService.getOrCreateSession(
            userId, otherUserId, productId, productType, productTitle
        );

        // 检查会话状态
        if (!tempSessionService.isSessionActive(sessionId)) {
            return R.fail("该会话已关闭，商品可能已下架或售出");
        }

        // 返回会话详情
        Map<String, Object> sessionInfo = toStringKeyMap(tempSessionService.getSessionInfo(sessionId));
        sessionInfo.put("sessionId", sessionId);

        return R.success(sessionInfo);
    }

    /**
     * 获取用户的会话列表
     */
    @GetMapping("/sessions")
    public R<List<Map<String, Object>>> listSessions() {
        String userId = getCurrentUserId();
        List<Map<String, Object>> sessions = tempSessionService.getUserSessions(userId);
        return R.success(sessions);
    }

    /**
     * 获取会话详情
     */
    @GetMapping("/sessions/{sessionId}")
    public R<Map<String, Object>> getSessionDetail(@PathVariable String sessionId) {
        String userId = getCurrentUserId();
        
        // 检查用户是否有权限访问此会话
        String[] participants = tempSessionService.getSessionParticipants(sessionId);
        boolean hasAccess = false;
        for (String p : participants) {
            if (userId.equals(p)) {
                hasAccess = true;
                break;
            }
        }
        if (!hasAccess) {
            return R.fail("无权访问此会话");
        }

        Map<String, Object> sessionInfo = toStringKeyMap(tempSessionService.getSessionInfo(sessionId));
        sessionInfo.put("sessionId", sessionId);

        // 检查会话状态
        String status = (String) sessionInfo.get("status");
        if (!TempSessionService.STATUS_ACTIVE.equals(status)) {
            return R.fail("该会话已关闭，商品可能已下架或售出");
        }

        return R.success(sessionInfo);
    }

    /**
     * 关闭会话
     */
    @PutMapping("/sessions/{sessionId}/close")
    public R<Void> closeSession(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        
        // 检查用户是否是会话参与者
        String[] participants = tempSessionService.getSessionParticipants(sessionId);
        boolean isParticipant = false;
        for (String p : participants) {
            if (userId.equals(p)) {
                isParticipant = true;
                break;
            }
        }
        if (!isParticipant) {
            return R.fail("无权操作此会话");
        }

        String reason = request != null ? request.get("reason") : null;
        if (reason == null) {
            reason = TempSessionService.STATUS_CLOSED;
        }

        tempSessionService.closeSession(sessionId, reason);
        return R.success("会话已关闭", null);
    }

    // ==================== 在线状态 ====================

    /**
     * 用户上线
     */
    @PostMapping("/online")
    public R<Void> userOnline() {
        String userId = getCurrentUserId();
        // 获取本服务器标识（用于分布式集群消息路由）
        String serverId = getServerId();
        tempSessionService.userOnline(userId, serverId);

        // 清除离线消息
        tempSessionService.popOfflineMessages(userId);

        return R.success("上线成功", null);
    }

    /**
     * 获取本服务器唯一标识
     */
    private String getServerId() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "server-" + System.currentTimeMillis();
        }
    }

    /**
     * 用户下线
     */
    @PostMapping("/offline")
    public R<Void> userOffline() {
        String userId = getCurrentUserId();
        tempSessionService.userOffline(userId);
        return R.success("下线成功", null);
    }

    /**
     * 心跳保活
     */
    @PostMapping("/heartbeat")
    public R<Void> heartbeat() {
        String userId = getCurrentUserId();
        tempSessionService.userHeartbeat(userId);
        return R.success();
    }

    /**
     * 检查用户是否在线
     */
    @GetMapping("/online/{userId}")
    public R<Map<String, Object>> checkOnline(@PathVariable String userId) {
        boolean isOnline = tempSessionService.isUserOnline(userId);
        Map<Object, Object> onlineInfo = tempSessionService.getOnlineInfo(userId);
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("userId", userId);
        result.put("online", isOnline);
        result.put("info", onlineInfo);
        
        return R.success(result);
    }

    /**
     * 获取离线消息
     */
    @GetMapping("/offline-messages")
    public R<List<Map<String, String>>> getOfflineMessages() {
        String userId = getCurrentUserId();
        List<Map<String, String>> messages = tempSessionService.getOfflineMessages(userId);
        return R.success(messages);
    }

    // ==================== 黑名单管理 ====================

    /**
     * 添加到黑名单
     */
    @PostMapping("/blacklist")
    public R<Void> addToBlacklist(@RequestBody Map<String, String> request) {
        String userId = getCurrentUserId();
        String blockedUserId = request.get("blockedUserId");
        
        if (blockedUserId == null || blockedUserId.isBlank()) {
            return R.fail("缺少被拉黑用户ID");
        }
        
        tempSessionService.addToBlacklist(userId, blockedUserId);
        return R.success("已拉黑该用户", null);
    }

    /**
     * 移除黑名单
     */
    @DeleteMapping("/blacklist/{blockedUserId}")
    public R<Void> removeFromBlacklist(@PathVariable String blockedUserId) {
        String userId = getCurrentUserId();
        tempSessionService.removeFromBlacklist(userId, blockedUserId);
        return R.success("已解除拉黑", null);
    }

    /**
     * 获取黑名单列表
     */
    @GetMapping("/blacklist")
    public R<List<Map<String, Object>>> getBlacklist() {
        String userId = getCurrentUserId();
        java.util.Set<String> blockedIds = tempSessionService.getBlacklist(userId);
        
        java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
        if (blockedIds != null) {
            for (String blockedId : blockedIds) {
                User user = userMapper.findById(blockedId);
                if (user != null) {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("userId", user.getId());
                    item.put("nickname", user.getNickname());
                    item.put("avatar", user.getAvatar());
                    result.add(item);
                }
            }
        }
        
        return R.success(result);
    }

    /**
     * 检查是否在黑名单
     */
    @GetMapping("/blacklist/check/{otherUserId}")
    public R<Boolean> checkBlacklist(@PathVariable String otherUserId) {
        String userId = getCurrentUserId();
        boolean isBlocked = tempSessionService.isInBlacklist(userId, otherUserId);
        return R.success(isBlocked);
    }

    // ==================== 未读消息 ====================

    /**
     * 获取总未读消息数
     */
    @GetMapping("/unread-count")
    public R<Long> getUnreadCount() {
        String userId = getCurrentUserId();
        long count = tempSessionService.getTotalUnreadCount(userId);
        return R.success(count);
    }

    /**
     * 清除某会话的未读消息
     */
    @DeleteMapping("/sessions/{sessionId}/unread")
    public R<Void> clearUnread(@PathVariable String sessionId) {
        String userId = getCurrentUserId();
        tempSessionService.clearUnreadCount(userId, sessionId);
        return R.success();
    }
}
