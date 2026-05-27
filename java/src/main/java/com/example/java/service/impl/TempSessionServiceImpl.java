package com.example.java.service.impl;

import com.example.java.entity.User;
import com.example.java.mapper.ChatMessageMapper;
import com.example.java.mapper.UserMapper;
import com.example.java.service.RedisTokenService;
import com.example.java.service.TempSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 临时会话服务实现 - 基于 Redis 实现闲鱼式临时对话
 * 
 * 数据模型：
 * 1. 在线状态 Hash: temp:online:{userId} -> {serverId, connectedAt, lastHeartbeat}
 * 2. 会话列表 Set: temp:sessions:{userId} -> {sessionId1, sessionId2}
 * 3. 会话详情 Hash: temp:session:{sessionId} -> {buyerId, sellerId, productId, productType, status, createdAt}
 * 4. 离线消息 List: temp:offline:{userId} -> [{msgId, sessionId, fromUserId, content, timestamp}, ...]
 * 5. 未读计数 Hash: temp:unread:{userId}:{sessionId} -> count
 * 6. 黑名单 Set: temp:blacklist:{userId} -> {blockedUserId1, blockedUserId2}
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TempSessionServiceImpl implements TempSessionService {

    private final StringRedisTemplate redisTemplate;
    private final RedisTokenService redisTokenService;
    private final UserMapper userMapper;
    private final ChatMessageMapper chatMessageMapper;

    // ============ Redis Key 前缀 ============
    private static final String KEY_ONLINE = "temp:online:";
    private static final String KEY_USER_SESSIONS = "temp:sessions:";
    private static final String KEY_SESSION = "temp:session:";
    private static final String KEY_OFFLINE = "temp:offline:";
    private static final String KEY_UNREAD = "temp:unread:";
    private static final String KEY_BLACKLIST = "temp:blacklist:";

    // ============ 会话配置 ============
    private static final long SESSION_EXPIRE_DAYS = 7;      // 会话有效期 7 天
    private static final long ONLINE_EXPIRE_SECONDS = 300;   // 在线状态 5 分钟过期
    private static final long HEARTBEAT_INTERVAL = 60;       // 心跳间隔 60 秒

    // ============ 在线状态管理 ============

    /**
     * 用户上线 - 记录在线状态
     */
    public void userOnline(String userId, String serverId) {
        String key = KEY_ONLINE + userId;
        Map<String, String> onlineInfo = new HashMap<>();
        onlineInfo.put("serverId", serverId);
        onlineInfo.put("connectedAt", String.valueOf(System.currentTimeMillis()));
        onlineInfo.put("lastHeartbeat", String.valueOf(System.currentTimeMillis()));
        
        redisTemplate.opsForHash().putAll(key, onlineInfo);
        redisTemplate.expire(key, ONLINE_EXPIRE_SECONDS, TimeUnit.SECONDS);
        
        log.info("【临时会话】用户上线：userId={}, serverId={}", userId, serverId);
    }

    /**
     * 用户下线 - 移除在线状态
     */
    public void userOffline(String userId) {
        String key = KEY_ONLINE + userId;
        redisTemplate.delete(key);
        
        log.info("【临时会话】用户下线：userId={}", userId);
    }

    /**
     * 用户心跳 - 续约在线状态
     */
    public void userHeartbeat(String userId) {
        String key = KEY_ONLINE + userId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            redisTemplate.opsForHash().put(key, "lastHeartbeat", String.valueOf(System.currentTimeMillis()));
            redisTemplate.expire(key, ONLINE_EXPIRE_SECONDS, TimeUnit.SECONDS);
        }
    }

    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(String userId) {
        String key = KEY_ONLINE + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 获取用户在线信息
     */
    public Map<Object, Object> getOnlineInfo(String userId) {
        String key = KEY_ONLINE + userId;
        return redisTemplate.opsForHash().entries(key);
    }

    // ============ 会话管理 ============

    /**
     * 创建临时会话 - 基于商品/供需对接创建
     * 
     * @param buyerId 买家ID
     * @param sellerId 卖家ID  
     * @param productId 商品/供需ID
     * @param productType 会话类型: product/connection/order
     * @param productTitle 商品标题（用于显示）
     * @return sessionId 会话ID
     */
    public String createSession(String buyerId, String sellerId, String productId, 
                                String productType, String productTitle) {
        // 生成会话ID
        String sessionId = generateSessionId();
        
        // 存储会话详情
        String sessionKey = KEY_SESSION + sessionId;
        Map<String, String> sessionInfo = new HashMap<>();
        sessionInfo.put("buyerId", buyerId);
        sessionInfo.put("sellerId", sellerId);
        sessionInfo.put("productId", productId);
        sessionInfo.put("productType", productType);
        sessionInfo.put("productTitle", productTitle != null ? productTitle : "");
        sessionInfo.put("status", TempSessionService.STATUS_ACTIVE);
        sessionInfo.put("createdAt", String.valueOf(System.currentTimeMillis()));
        
        redisTemplate.opsForHash().putAll(sessionKey, sessionInfo);
        redisTemplate.expire(sessionKey, SESSION_EXPIRE_DAYS, TimeUnit.DAYS);
        
        // 将会话ID加入用户的会话列表
        redisTemplate.opsForSet().add(KEY_USER_SESSIONS + buyerId, sessionId);
        redisTemplate.opsForSet().add(KEY_USER_SESSIONS + sellerId, sessionId);
        
        log.info("【临时会话】创建会话：sessionId={}, buyer={}, seller={}, product={}, type={}", 
                sessionId, buyerId, sellerId, productId, productType);
        
        return sessionId;
    }

    /**
     * 获取或创建会话 - 如果已存在则返回现有会话
     */
    public String getOrCreateSession(String buyerId, String sellerId, String productId, 
                                     String productType, String productTitle) {
        // 尝试从已有会话中查找
        String existingSessionId = findExistingSession(buyerId, sellerId, productId, productType);
        if (existingSessionId != null) {
            // 更新会话状态为活跃
            updateSessionStatus(existingSessionId, TempSessionService.STATUS_ACTIVE);
            return existingSessionId;
        }
        
        // 创建新会话
        return createSession(buyerId, sellerId, productId, productType, productTitle);
    }

    /**
     * 查找已存在的会话
     */
    private String findExistingSession(String buyerId, String sellerId, String productId, String productType) {
        // 遍历用户的会话列表查找匹配
        Set<String> sessions = redisTemplate.opsForSet().members(KEY_USER_SESSIONS + buyerId);
        if (sessions == null || sessions.isEmpty()) {
            return null;
        }
        
        for (String sessionId : sessions) {
            Map<Object, Object> info = redisTemplate.opsForHash().entries(KEY_SESSION + sessionId);
            if (info.isEmpty()) continue;
            
            String status = (String) info.get("status");
            if (!TempSessionService.STATUS_ACTIVE.equals(status)) continue;
            
            String pId = (String) info.get("productId");
            String pType = (String) info.get("productType");
            if (!productId.equals(pId) || !productType.equals(pType)) continue;
            
            // 检查用户是否参与此会话
            String bId = (String) info.get("buyerId");
            String sId = (String) info.get("sellerId");
            if ((buyerId.equals(bId) && sellerId.equals(sId)) || 
                (buyerId.equals(sId) && sellerId.equals(bId))) {
                return sessionId;
            }
        }
        
        return null;
    }

    /**
     * 获取会话详情
     */
    public Map<Object, Object> getSessionInfo(String sessionId) {
        return redisTemplate.opsForHash().entries(KEY_SESSION + sessionId);
    }

    /**
     * 更新会话状态
     */
    public void updateSessionStatus(String sessionId, String status) {
        String key = KEY_SESSION + sessionId;
        redisTemplate.opsForHash().put(key, "status", status);
        log.info("【临时会话】会话状态更新：sessionId={}, status={}", sessionId, status);
    }

    /**
     * 关闭会话 - 当商品下架/售出时调用
     */
    public void closeSession(String sessionId, String reason) {
        updateSessionStatus(sessionId, reason);
        log.info("【临时会话】会话关闭：sessionId={}, reason={}", sessionId, reason);
    }

    /**
     * 获取用户的会话列表（按最近活动时间排序）
     */
    public List<Map<String, Object>> getUserSessions(String userId) {
        Set<String> sessionIds = redisTemplate.opsForSet().members(KEY_USER_SESSIONS + userId);
        if (sessionIds == null || sessionIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Map<String, Object>> sessions = new ArrayList<>();
        for (String sessionId : sessionIds) {
            Map<Object, Object> info = redisTemplate.opsForHash().entries(KEY_SESSION + sessionId);
            if (info.isEmpty()) continue;
            
            Map<String, Object> session = new HashMap<>();
            session.put("sessionId", sessionId);
            session.put("buyerId", info.get("buyerId"));
            session.put("sellerId", info.get("sellerId"));
            session.put("productId", info.get("productId"));
            session.put("productType", info.get("productType"));
            session.put("productTitle", info.get("productTitle"));
            session.put("status", info.get("status"));
            session.put("createdAt", info.get("createdAt"));
            
            // 获取未读消息数
            String otherUserId = getOtherUserId(info, userId);
            session.put("otherUserId", otherUserId);
            session.put("unreadCount", getUnreadCount(userId, sessionId));
            
            // 获取对方用户信息
            if (otherUserId != null) {
                User user = userMapper.findById(otherUserId);
                if (user != null) {
                    session.put("otherUserNickname", user.getNickname());
                    session.put("otherUserAvatar", user.getAvatar());
                }
            }
            
            sessions.add(session);
        }
        
        // 按创建时间倒序
        sessions.sort((a, b) -> {
            String timeA = (String) a.get("createdAt");
            String timeB = (String) b.get("createdAt");
            return timeB.compareTo(timeA);
        });
        
        return sessions;
    }

    // ============ 消息管理 ============

    /**
     * 存储离线消息
     */
    public void storeOfflineMessage(String receiverId, String sessionId, String fromUserId, 
                                    String content, Long msgId) {
        String key = KEY_OFFLINE + receiverId;
        
        Map<String, String> msg = new HashMap<>();
        msg.put("msgId", msgId != null ? msgId.toString() : "");
        msg.put("sessionId", sessionId);
        msg.put("fromUserId", fromUserId);
        msg.put("content", content);
        msg.put("timestamp", String.valueOf(System.currentTimeMillis()));
        
        try {
            redisTemplate.opsForList().leftPush(key, new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(msg));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.error("【临时会话】序列化离线消息失败", e);
            return;
        }

        // 增加未读计数
        incrementUnreadCount(receiverId, sessionId);
        
        log.debug("【临时会话】存储离线消息：receiver={}, from={}, session={}", receiverId, fromUserId, sessionId);
    }

    /**
     * 获取离线消息
     */
    public List<Map<String, String>> getOfflineMessages(String userId) {
        String key = KEY_OFFLINE + userId;
        List<String> messages = redisTemplate.opsForList().range(key, 0, -1);
        
        if (messages == null || messages.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Map<String, String>> result = new ArrayList<>();
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        
        for (String msgJson : messages) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> msg = mapper.readValue(msgJson, Map.class);
                result.add(msg);
            } catch (Exception e) {
                log.error("【临时会话】解析离线消息失败：{}", msgJson, e);
            }
        }
        
        return result;
    }

    /**
     * 清除离线消息
     */
    public void clearOfflineMessages(String userId) {
        String key = KEY_OFFLINE + userId;
        redisTemplate.delete(key);
    }

    /**
     * 获取离线消息并清除
     */
    public List<Map<String, String>> popOfflineMessages(String userId) {
        // 先获取再清除，减少消息丢失（两操作之间新到达的消息仍可能丢失，但已大幅优于原实现）
        List<Map<String, String>> messages = getOfflineMessages(userId);
        if (messages != null && !messages.isEmpty()) {
            clearOfflineMessages(userId);
        }
        return messages != null ? messages : java.util.Collections.emptyList();
    }

    // ============ 未读消息管理 ============

    /**
     * 增加未读计数
     */
    public void incrementUnreadCount(String userId, String sessionId) {
        String key = KEY_UNREAD + userId + ":" + sessionId;
        redisTemplate.opsForValue().increment(key);
        // 设置 30 天过期
        redisTemplate.expire(key, 30, TimeUnit.DAYS);
    }

    /**
     * 获取未读计数
     */
    public long getUnreadCount(String userId, String sessionId) {
        String key = KEY_UNREAD + userId + ":" + sessionId;
        String count = redisTemplate.opsForValue().get(key);
        return count != null ? Long.parseLong(count) : 0;
    }

    /**
     * 清除未读计数
     */
    public void clearUnreadCount(String userId, String sessionId) {
        String key = KEY_UNREAD + userId + ":" + sessionId;
        redisTemplate.delete(key);
    }

    /**
     * 获取用户总未读消息数
     */
    public long getTotalUnreadCount(String userId) {
        Set<String> sessionIds = redisTemplate.opsForSet().members(KEY_USER_SESSIONS + userId);
        if (sessionIds == null || sessionIds.isEmpty()) {
            return 0;
        }
        
        long total = 0;
        for (String sessionId : sessionIds) {
            total += getUnreadCount(userId, sessionId);
        }
        
        return total;
    }

    // ============ 黑名单管理 ============

    /**
     * 添加到黑名单
     */
    public void addToBlacklist(String userId, String blockedUserId) {
        redisTemplate.opsForSet().add(KEY_BLACKLIST + userId, blockedUserId);
        log.info("【临时会话】添加黑名单：user={}, blocked={}", userId, blockedUserId);
    }

    /**
     * 移除黑名单
     */
    public void removeFromBlacklist(String userId, String blockedUserId) {
        redisTemplate.opsForSet().remove(KEY_BLACKLIST + userId, blockedUserId);
        log.info("【临时会话】移除黑名单：user={}, blocked={}", userId, blockedUserId);
    }

    /**
     * 检查是否在黑名单
     */
    public boolean isInBlacklist(String userId, String otherUserId) {
        Boolean isMember = redisTemplate.opsForSet().isMember(KEY_BLACKLIST + userId, otherUserId);
        return Boolean.TRUE.equals(isMember);
    }

    /**
     * 获取黑名单列表
     */
    public Set<String> getBlacklist(String userId) {
        return redisTemplate.opsForSet().members(KEY_BLACKLIST + userId);
    }

    // ============ 辅助方法 ============

    /**
     * 生成会话ID
     */
    private String generateSessionId() {
        return "TS" + System.currentTimeMillis() + String.format("%04d", new Random().nextInt(10000));
    }

    /**
     * 获取会话中的对方用户ID
     */
    private String getOtherUserId(Map<Object, Object> sessionInfo, String currentUserId) {
        String buyerId = (String) sessionInfo.get("buyerId");
        String sellerId = (String) sessionInfo.get("sellerId");
        
        if (currentUserId.equals(buyerId)) {
            return sellerId;
        } else if (currentUserId.equals(sellerId)) {
            return buyerId;
        }
        
        return null;
    }

    /**
     * 检查会话是否有效
     */
    public boolean isSessionActive(String sessionId) {
        Map<Object, Object> info = getSessionInfo(sessionId);
        if (info.isEmpty()) {
            return false;
        }
        
        String status = (String) info.get("status");
        return TempSessionService.STATUS_ACTIVE.equals(status);
    }

    /**
     * 获取会话中的参与者
     */
    public String[] getSessionParticipants(String sessionId) {
        Map<Object, Object> info = getSessionInfo(sessionId);
        if (info.isEmpty()) {
            return new String[0];
        }
        
        String buyerId = (String) info.get("buyerId");
        String sellerId = (String) info.get("sellerId");
        
        return new String[]{buyerId, sellerId};
    }
}
