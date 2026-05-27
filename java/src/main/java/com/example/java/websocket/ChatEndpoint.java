package com.example.java.websocket;

import com.example.java.config.ChatWsHandshakeInterceptor;
import com.example.java.service.ChatMessageService;
import com.example.java.util.HtmlEscapeUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import jakarta.websocket.server.ServerEndpointConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

import java.io.IOException;
import java.net.InetAddress;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 实时聊天 WebSocket 端点（分布式集群版）
 *
 * 端点地址：ws://host/ws/chat
 *
 * 架构设计（解决单例状态问题）：
 *   - 在线用户状态存储在 Redis Hash 中（跨 JVM 共享）
 *   - 消息通过 Redis Pub/Sub 广播（跨实例投递）
 *   - 每个实例维护本地 Session 映射（本地发送）
 *   - 首次连接时订阅 Redis 频道，收到消息后查找本地 Session 发送
 *
 * Redis 数据结构：
 *   chat:online:{userId} → Hash { sessionId, nickname, serverId, connectedAt }
 *   chat:channel       → Pub/Sub 频道
 *
 * 注意：此类由 WebSocket 容器直接实例化，不归 Spring 管理。
 * Spring Bean 通过 SpringContextHolder 手动获取。
 *
 * 消息格式（客户端 → 服务端）：
 *   { "type": "chat", "to": "userId", "content": "你好", "jobId": 1 }
 *
 * 消息格式（服务端 → 客户端）：
 *   { "type": "chat", "from": "userId", "fromNickname": "小明",
 *     "to": "userId", "content": "你好", "timestamp": 1710000000000 }
 */
@Slf4j
@ServerEndpoint(value = "/chat", configurator = ChatWsHandshakeInterceptor.class)
public class ChatEndpoint {

    // ==================== Redis 常量 ====================
    private static final String REDIS_KEY_ONLINE = "chat:online:";
    private static final String REDIS_KEY_ALL_ONLINE = "chat:all_online";
    private static final String REDIS_CHANNEL = "chat:channel";
    private static final long ONLINE_TTL_SECONDS = 300; // 5 分钟心跳续期

    // ==================== 本地 Session 管理 ====================

    /**
     * 本地 Session 映射表（实例内线程安全）
     * Key = userId，Value = LocalSession（session + nickname）
     * 仅用于本实例的快速 Session 查找，不作为权威状态
     */
    private static final ConcurrentHashMap<String, LocalSession> LOCAL_SESSIONS = new ConcurrentHashMap<>();

    // ==================== Redis/Spring 静态引用（由第一个连接初始化） ====================
    private static StringRedisTemplate redisTemplate;
    private static RedisMessageListenerContainer redisListenerContainer;
    private static StringRedisTemplate pubsubTemplate;
    private static volatile boolean redisInitialized = false;
    private static final Object initLock = new Object();

    // ==================== 实例变量 ====================
    private Session session;
    private String sessionId;
    private String userId;
    private String nickname;
    private ObjectMapper objectMapper;
    private ChatMessageService chatMessageService;
    private boolean subscribed = false;

    // ==================== Redis 初始化（首次连接时执行一次） ====================

    private static void ensureRedisInitialized() {
        if (redisInitialized) return;
        synchronized (initLock) {
            if (redisInitialized) return;
            try {
                redisTemplate = SpringContextHolder.getBean(StringRedisTemplate.class);
                pubsubTemplate = SpringContextHolder.getBean(StringRedisTemplate.class);
                redisListenerContainer = SpringContextHolder.getBean(RedisMessageListenerContainer.class);

                // 动态监听器：收到 Redis 消息后分发给本地 Session
                MessageListenerAdapter adapter = new MessageListenerAdapter(
                        new ChatRedisMessageListener(), "handleMessage");
                adapter.setSerializer(null);
                redisListenerContainer.addMessageListener(adapter, new ChannelTopic(REDIS_CHANNEL));

                redisInitialized = true;
                log.info("【聊天】Redis Pub/Sub 初始化成功，频道={}", REDIS_CHANNEL);
            } catch (Exception e) {
                log.error("【聊天】Redis 初始化失败", e);
            }
        }
    }

    // ==================== 生命周期方法 ====================

    @OnOpen
    public void onOpen(Session session, EndpointConfig config) {
        this.session = session;
        this.sessionId = session.getId();

        // ----- 1. 获取用户身份 -----
        Map<String, Object> userProps = session.getUserProperties();
        this.userId = getStringProp(userProps, "userId");
        this.nickname = getStringProp(userProps, "nickname");

        if (this.userId == null || this.userId.isBlank()) {
            log.warn("【聊天】WebSocket 连接缺少用户身份，主动断开");
            try {
                session.close(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, "未认证"));
            } catch (IOException ignored) {}
            return;
        }

        // ----- 2. 初始化 Redis（首次连接） -----
        ensureRedisInitialized();

        // ----- 3. 获取 Spring Bean -----
        try {
            this.objectMapper = SpringContextHolder.getBean(ObjectMapper.class);
            this.chatMessageService = SpringContextHolder.getBean(ChatMessageService.class);
        } catch (Exception e) {
            log.error("【聊天】获取 Spring Bean 失败", e);
            closeWithReason(session, CloseReason.CloseCodes.UNEXPECTED_CONDITION, "服务初始化失败");
            return;
        }

        // ----- 4. 写入 Redis 在线状态 + 加入本地 Session -----
        try {
            String serverId = getServerId();
            if (redisTemplate != null) {
                String key = REDIS_KEY_ONLINE + userId;
                redisTemplate.opsForHash().put(key, "sessionId", sessionId);
                redisTemplate.opsForHash().put(key, "nickname", nickname != null ? nickname : "");
                redisTemplate.opsForHash().put(key, "serverId", serverId);
                redisTemplate.opsForHash().put(key, "connectedAt", String.valueOf(System.currentTimeMillis()));
                redisTemplate.expire(key, ONLINE_TTL_SECONDS, TimeUnit.SECONDS);
                redisTemplate.opsForSet().add(REDIS_KEY_ALL_ONLINE, userId);
            }
        } catch (Exception e) {
            log.error("【聊天】写入 Redis 在线状态失败", e);
        }

        LOCAL_SESSIONS.put(userId, new LocalSession(session, userId, nickname));

        log.info("【聊天】用户上线：userId={}，nickname={}，当前本地在线={}人",
                userId, nickname, LOCAL_SESSIONS.size());

        // ----- 5. 广播上线通知 + 在线人数 -----
        broadcastSystem(nickname + " 进入了聊天室");
        broadcastOnlineCount();
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        if (this.userId == null) {
            log.warn("【聊天】收到未认证消息，忽略");
            return;
        }

        // ----- 心跳处理 -----
        if ("ping".equalsIgnoreCase(message.trim())) {
            sendText(session, "pong");
            refreshOnlineTTL();
            return;
        }

        // ----- 解析 JSON -----
        try {
            Map<String, Object> msg = objectMapper.readValue(message, Map.class);
            String type = getStringProp(msg, "type");
            if (type == null) type = "chat";

            if ("ping".equalsIgnoreCase(type)) {
                sendText(session, "pong");
                refreshOnlineTTL();
                return;
            }

            if ("chat".equalsIgnoreCase(type)) {
                String toUserId = getStringProp(msg, "to");
                String content = getStringProp(msg, "content");
                if (content == null) content = "";

                Integer jobId = null;
                Object j = msg.get("jobId");
                if (j instanceof Number) jobId = ((Number) j).intValue();

                Integer connectionId = null;
                Object c = msg.get("connectionId");
                if (c instanceof Number) connectionId = ((Number) c).intValue();

                // 持久化
                saveMessage(toUserId, jobId, connectionId, content);

                // 通过 Redis 广播，跨实例送达
                publishChatMessage(userId, nickname, toUserId, content, jobId, connectionId);
            }
        } catch (Exception e) {
            log.error("【聊天】解析/处理消息异常：{}", message, e);
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        if (this.userId != null) {
            LOCAL_SESSIONS.remove(userId);

            // ----- 从 Redis 移除在线状态 -----
            try {
                if (redisTemplate != null) {
                    redisTemplate.delete(REDIS_KEY_ONLINE + userId);
                    redisTemplate.opsForSet().remove(REDIS_KEY_ALL_ONLINE, userId);
                }
            } catch (Exception e) {
                log.error("【聊天】从 Redis 移除在线状态失败", e);
            }

            log.info("【聊天】用户下线：userId={}，nickname={}，原因={}，当前本地在线={}人",
                    userId, nickname, closeReason.getReasonPhrase(), LOCAL_SESSIONS.size());

            if (this.nickname != null) {
                broadcastSystem(nickname + " 离开了聊天室");
            }
            broadcastOnlineCount();
        }
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        log.error("【聊天】WebSocket 异常：userId={}", this.userId, throwable);
        if (this.userId != null) {
            LOCAL_SESSIONS.remove(userId);
            try {
                if (redisTemplate != null) {
                    redisTemplate.delete(REDIS_KEY_ONLINE + userId);
                    redisTemplate.opsForSet().remove(REDIS_KEY_ALL_ONLINE, userId);
                }
            } catch (Exception ignored) {}
        }
    }

    // ==================== Redis 消息发布 ====================

    private void publishChatMessage(String fromUid, String fromNick,
                                   String toUid, String content,
                                   Integer jobId, Integer connectionId) {
        try {
            if (pubsubTemplate == null) {
                // Redis 未就绪，降级为本地发送
                sendToUserLocal(fromUid, fromNick, toUid, content, jobId, connectionId);
                return;
            }

            ConcurrentHashMap<String, Object> payload = new ConcurrentHashMap<>();
            payload.put("action", "chat");
            payload.put("from", fromUid);
            payload.put("fromNickname", fromNick);
            payload.put("to", toUid != null ? toUid : "all");
            payload.put("content", HtmlEscapeUtils.escapeAndStrip(content));
            payload.put("timestamp", System.currentTimeMillis());
            if (jobId != null) payload.put("jobId", jobId);
            if (connectionId != null) payload.put("connectionId", connectionId);

            pubsubTemplate.convertAndSend(REDIS_CHANNEL, objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.error("【聊天】发布消息到 Redis 失败，降级为本地发送", e);
            sendToUserLocal(fromUid, fromNick, toUid, content, jobId, connectionId);
        }
    }

    private void publishSystemMessage(String content) {
        try {
            if (pubsubTemplate == null) return;
            ConcurrentHashMap<String, Object> payload = new ConcurrentHashMap<>();
            payload.put("action", "system");
            payload.put("from", "system");
            payload.put("fromNickname", "系统");
            payload.put("to", "all");
            payload.put("content", content);
            payload.put("timestamp", System.currentTimeMillis());
            pubsubTemplate.convertAndSend(REDIS_CHANNEL, objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.error("【聊天】发布系统消息到 Redis 失败", e);
        }
    }

    private void publishOnlineCount() {
        try {
            if (pubsubTemplate == null) return;
            long count = redisTemplate != null
                    ? redisTemplate.opsForSet().size(REDIS_KEY_ALL_ONLINE) : LOCAL_SESSIONS.size();
            ConcurrentHashMap<String, Object> payload = new ConcurrentHashMap<>();
            payload.put("action", "online_count");
            payload.put("content", String.valueOf(count));
            payload.put("timestamp", System.currentTimeMillis());
            pubsubTemplate.convertAndSend(REDIS_CHANNEL, objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.error("【聊天】发布在线人数到 Redis 失败", e);
        }
    }

    // ==================== 本地 Session 发送（Redis 消息到达时调用） ====================

    /**
     * 向本地 Session 发送消息（跨实例通信的最后一跳）
     */
    static void deliverToLocal(String userId, String json) {
        LocalSession local = LOCAL_SESSIONS.get(userId);
        if (local != null && local.session.isOpen()) {
            sendText(local.session, json);
        }
    }

    /**
     * 向本地所有 Session 广播（跨实例通信的最后一跳）
     */
    static void deliverToLocalAll(String json) {
        for (LocalSession local : LOCAL_SESSIONS.values()) {
            if (local.session.isOpen()) {
                sendText(local.session, json);
            }
        }
    }

    /**
     * 获取本地在线用户数
     */
    static int getLocalOnlineCount() {
        int count = 0;
        for (LocalSession local : LOCAL_SESSIONS.values()) {
            if (local.session.isOpen()) count++;
        }
        return count;
    }

    private void sendToUserLocal(String fromUid, String fromNick, String toUid,
                                 String content, Integer jobId, Integer connectionId) {
        String json = buildMessage(ChatMsgType.CHAT, fromUid, fromNick, toUid, content, jobId, connectionId);
        if ("all".equalsIgnoreCase(toUid)) {
            deliverToLocalAll(json);
        } else {
            deliverToLocal(toUid, json);
        }
    }

    private void broadcastSystem(String content) {
        publishSystemMessage(content);
    }

    private void broadcastOnlineCount() {
        publishOnlineCount();
    }

    // ==================== 在线状态 TTL 续期 ====================

    private void refreshOnlineTTL() {
        try {
            if (redisTemplate != null) {
                redisTemplate.expire(REDIS_KEY_ONLINE + userId, ONLINE_TTL_SECONDS, TimeUnit.SECONDS);
            }
        } catch (Exception ignored) {}
    }

    // ==================== 私有工具方法 ====================

    private String getServerId() {
        try {
            return InetAddress.getLocalHost().getHostName() + ":" + Runtime.getRuntime().availableProcessors();
        } catch (Exception e) {
            return "server:" + System.currentTimeMillis();
        }
    }

    private String getStringProp(Map<String, ?> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private static void sendText(Session s, String text) {
        if (s != null && s.isOpen()) {
            try {
                synchronized (s) {
                    s.getBasicRemote().sendText(text);
                }
            } catch (IOException e) {
                log.error("【聊天】发送消息失败", e);
            }
        }
    }

    private void closeWithReason(Session s, CloseReason.CloseCode code, String reason) {
        try {
            s.close(new CloseReason(code, reason));
        } catch (IOException ignored) {}
    }

    private String buildMessage(ChatMsgType type, String fromUid, String fromNick,
                                String toUid, String content, Integer jobId, Integer connectionId) {
        try {
            ConcurrentHashMap<String, Object> msg = new ConcurrentHashMap<>();
            msg.put("type", type.name().toLowerCase());
            msg.put("from", fromUid);
            msg.put("fromNickname", fromNick);
            msg.put("to", toUid != null ? toUid : "all");
            msg.put("content", HtmlEscapeUtils.escapeAndStrip(content));
            msg.put("timestamp", System.currentTimeMillis());
            if (jobId != null) msg.put("jobId", jobId);
            if (connectionId != null) msg.put("connectionId", connectionId);
            return objectMapper.writeValueAsString(msg);
        } catch (Exception e) {
            log.error("【聊天】序列化消息失败", e);
            return "{}";
        }
    }

    private void saveMessage(String toUserId, Integer jobId, Integer connectionId, String content) {
        if (this.chatMessageService == null || content == null || content.trim().isEmpty()) {
            return;
        }
        try {
            String finalToUserId = (toUserId == null || "all".equalsIgnoreCase(toUserId)) ? null : toUserId;
            this.chatMessageService.saveMessage(this.userId, finalToUserId, jobId, connectionId, content.trim());
        } catch (Exception e) {
            log.error("【聊天】保存聊天记录失败", e);
        }
    }

    // ==================== 内部类 ====================

    private static class LocalSession {
        final Session session;
        final String userId;
        final String nickname;

        LocalSession(Session session, String userId, String nickname) {
            this.session = session;
            this.userId = userId;
            this.nickname = nickname;
        }
    }

    /**
     * Redis Pub/Sub 消息监听器（静态内部类，无状态）
     * 所有实例共享同一个监听器实例，收到消息后根据 target 分发
     */
    private static class ChatRedisMessageListener {
        public void handleMessage(String message) {
            try {
                ConcurrentHashMap<String, Object> payload = objectMapperFromString(message);
                if (payload == null) return;

                String action = getStr(payload, "action");
                String to = getStr(payload, "to");
                String json = objectMapperFromStringToJson(payload);

                if ("chat".equals(action)) {
                    if ("all".equalsIgnoreCase(to)) {
                        ChatEndpoint.deliverToLocalAll(json);
                    } else if (to != null) {
                        ChatEndpoint.deliverToLocal(to, json);
                    }
                } else if ("system".equals(action) || "online_count".equals(action)) {
                    ChatEndpoint.deliverToLocalAll(json);
                }
            } catch (Exception e) {
                log.error("【聊天】Redis 消息处理异常：{}", message, e);
            }
        }

        @SuppressWarnings("unchecked")
        private ConcurrentHashMap<String, Object> objectMapperFromString(String json) {
            try {
                ObjectMapper om = SpringContextHolder.getBean(ObjectMapper.class);
                @SuppressWarnings("unchecked")
                Map<String, Object> raw = om.readValue(json, Map.class);
                return new ConcurrentHashMap<>(raw);
            } catch (Exception e) {
                return null;
            }
        }

        private String objectMapperFromStringToJson(ConcurrentHashMap<String, Object> payload) {
            try {
                ObjectMapper om = SpringContextHolder.getBean(ObjectMapper.class);
                return om.writeValueAsString(payload);
            } catch (Exception e) {
                return "{}";
            }
        }

        private String getStr(ConcurrentHashMap<String, Object> map, String key) {
            Object v = map.get(key);
            return v != null ? v.toString() : null;
        }
    }

    private enum ChatMsgType {
        CHAT,
        SYSTEM,
        ONLINE_COUNT
    }
}
