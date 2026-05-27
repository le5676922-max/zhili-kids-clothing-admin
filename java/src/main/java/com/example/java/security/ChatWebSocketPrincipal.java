package com.example.java.security;

import java.security.Principal;

/**
 * WebSocket 会话用户标识
 *
 * 用于在 WebSocket 连接中标识已认证用户。
 * 在 ChatWsHandshakeInterceptor 的 modifyHandshake 中创建并绑定到 Session。
 */
public class ChatWebSocketPrincipal implements Principal {

    private final String userId;
    private final String nickname;
    private final String token;

    public ChatWebSocketPrincipal(String userId, String nickname, String token) {
        this.userId = userId;
        this.nickname = nickname;
        this.token = token;
    }

    @Override
    public String getName() {
        return userId;
    }

    public String getUserId() {
        return userId;
    }

    public String getNickname() {
        return nickname;
    }

    public String getToken() {
        return token;
    }
}
