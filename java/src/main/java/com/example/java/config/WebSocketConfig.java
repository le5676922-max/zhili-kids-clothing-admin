package com.example.java.config;

import com.example.java.entity.User;
import com.example.java.mapper.UserMapper;
import com.example.java.security.JwtUtils;
import com.example.java.security.WorkOrderWebSocketPrincipal;
import com.example.java.service.RedisTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * 工单聊天 WebSocket 配置：STOMP over SockJS
 */
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;
    private final RedisTokenService redisTokenService;

    /**
     * 判断用户是否为管理员（与 HTTP 接口一致）
     */
    private static boolean isAdminUser(User user) {
        return user != null && user.hasAdminRole();
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // 优先从 token header 取，其次从 Authorization header 取
                    String token = accessor.getFirstNativeHeader("token");
                    if (!StringUtils.hasText(token)) {
                        String auth = accessor.getFirstNativeHeader("Authorization");
                        if (StringUtils.hasText(auth) && auth.startsWith("Bearer ")) {
                            token = auth.substring(7);
                        }
                    }
                    if (!StringUtils.hasText(token) || !jwtUtils.validateToken(token)) {
                        throw new org.springframework.messaging.MessagingException("未认证，请先登录");
                    }
                    // ----- Phase 3：检查 Redis 黑名单 -----
                    if (!redisTokenService.isTokenValid(token)) {
                        throw new org.springframework.messaging.MessagingException("Token 已在其他设备注销，请重新登录");
                    }
                    String userId = jwtUtils.getUserId(token);
                    User user = userMapper.findById(userId);
                    boolean isAdmin = isAdminUser(user);
                    accessor.setUser(new WorkOrderWebSocketPrincipal(userId, isAdmin));
                }
                return message;
            }
        });
    }
}
