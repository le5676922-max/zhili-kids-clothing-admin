package com.example.java.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 临时会话服务 - 基于 Redis 实现闲鱼式临时对话
 */
public interface TempSessionService {

    // ============ 会话类型 ============
    String TYPE_PRODUCT = "product";
    String TYPE_CONNECTION = "connection";
    String TYPE_ORDER = "order";
    /** 人才招聘：求职者与企业就某一职位发起的临时会话 */
    String TYPE_JOB = "job";

    // ============ 会话状态 ============
    String STATUS_ACTIVE = "active";
    String STATUS_CLOSED = "closed";
    String STATUS_EXPIRED = "expired";
    String STATUS_PRODUCT_SOLD = "product_sold";

    void userOnline(String userId, String serverId);

    void userOffline(String userId);

    void userHeartbeat(String userId);

    boolean isUserOnline(String userId);

    Map<Object, Object> getOnlineInfo(String userId);

    String createSession(String buyerId, String sellerId, String productId,
                         String productType, String productTitle);

    String getOrCreateSession(String buyerId, String sellerId, String productId,
                              String productType, String productTitle);

    Map<Object, Object> getSessionInfo(String sessionId);

    void updateSessionStatus(String sessionId, String status);

    void closeSession(String sessionId, String reason);

    List<Map<String, Object>> getUserSessions(String userId);

    void storeOfflineMessage(String receiverId, String sessionId, String fromUserId,
                             String content, Long msgId);

    List<Map<String, String>> getOfflineMessages(String userId);

    void clearOfflineMessages(String userId);

    List<Map<String, String>> popOfflineMessages(String userId);

    long getUnreadCount(String userId, String sessionId);

    void incrementUnreadCount(String userId, String sessionId);

    void clearUnreadCount(String userId, String sessionId);

    long getTotalUnreadCount(String userId);

    void addToBlacklist(String userId, String blockedUserId);

    void removeFromBlacklist(String userId, String blockedUserId);

    boolean isInBlacklist(String userId, String otherUserId);

    Set<String> getBlacklist(String userId);

    boolean isSessionActive(String sessionId);

    String[] getSessionParticipants(String sessionId);
}
