package com.example.java.config;

import com.example.java.security.JwtUtils;
import com.example.java.service.RedisTokenService;
import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * WebSocket 握手拦截器：通过 URL 参数中的 token 进行 JWT 鉴权
 *
 * 前端连接方式：ws://host/ws/chat?token=xxx
 *
 * Phase 3 核心：标准 WebSocket API 无法携带 HTTP Header，
 * 因此将 token 放在 URL 参数中，在握手阶段统一校验。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWsHandshakeInterceptor extends ServerEndpointConfig.Configurator {

    private final JwtUtils jwtUtils;
    private final RedisTokenService redisTokenService;

    /**
     * 握手拦截核心方法
     *
     * 执行时机：WebSocket 连接建立前，TCP 握手阶段
     *
     * @param config  Endpoint 配置（用于存放用户信息到 Session）
     * @param request WebSocket 握手请求（可获取 URL 参数）
     * @param response WebSocket 握手响应
     */
    @Override
    public void modifyHandshake(
            ServerEndpointConfig config,
            HandshakeRequest request,
            HandshakeResponse response) {

        // ----- 1. 从 URL 参数中提取 token -----
        Map<String, List<String>> params = request.getParameterMap();
        String token = null;
        if (params.containsKey("token") && !params.get("token").isEmpty()) {
            token = params.get("token").get(0);
        }

        // ----- 2. Token 为空 → 拒绝连接 -----
        if (token == null || token.isBlank()) {
            log.warn("WebSocket 握手失败：token 为空");
            throw new RuntimeException("未提供认证 token，请先登录");
        }

        // ----- 3. JWT 签名校验 -----
        if (!jwtUtils.validateToken(token)) {
            log.warn("WebSocket 握手失败：token 签名无效或已过期");
            throw new RuntimeException("token 无效或已过期，请重新登录");
        }

        // ----- 4. Redis 黑名单校验（Phase 3：支持主动注销） -----
        if (!redisTokenService.isTokenValid(token)) {
            log.warn("WebSocket 握手失败：token 已在其他设备注销");
            throw new RuntimeException("账号已在其他设备登录，请重新登录");
        }

        // ----- 5. 解析用户信息 -----
        String userId;
        String nickname;
        try {
            userId = jwtUtils.getUserId(token);
            nickname = jwtUtils.getUsername(token);
            if (nickname == null || nickname.isBlank()) {
                nickname = jwtUtils.getEmail(token);
            }
        } catch (Exception e) {
            log.error("WebSocket 握手失败：解析 token 内容异常", e);
            throw new RuntimeException("token 内容解析异常");
        }

        if (userId == null || userId.isBlank()) {
            log.warn("WebSocket 握手失败：token 中无 userId");
            throw new RuntimeException("token 信息不完整");
        }

        // ----- 6. 将用户信息存入 WebSocket Session -----
        // 在 ChatEndpoint 的 @OnOpen 中通过 session.getUserProperties() 取到
        config.getUserProperties().put("userId", userId);
        config.getUserProperties().put("nickname", nickname);
        config.getUserProperties().put("token", token);

        log.info("WebSocket 握手成功：userId={}，nickname={}", userId, nickname);
    }
}
