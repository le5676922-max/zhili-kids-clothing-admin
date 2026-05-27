package com.example.java.security;

import java.security.Principal;

/**
 * WebSocket 会话用户标识，用于工单聊天鉴权
 */
public class WorkOrderWebSocketPrincipal implements Principal {

    private final String userId;
    private final boolean admin;

    public WorkOrderWebSocketPrincipal(String userId, boolean admin) {
        this.userId = userId;
        this.admin = admin;
    }

    @Override
    public String getName() {
        return userId;
    }

    public String getUserId() {
        return userId;
    }

    public boolean isAdmin() {
        return admin;
    }
}
