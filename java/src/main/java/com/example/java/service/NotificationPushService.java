package com.example.java.service;

import com.example.java.dto.NotificationVO;

/**
 * 站内通知 WebSocket 推送服务
 */
public interface NotificationPushService {

    /**
     * 推送新通知给指定用户
     * @param userId 接收通知的用户ID
     * @param notification 通知内容
     */
    void pushNotification(String userId, NotificationVO notification);

    /**
     * 推送未读数量更新给指定用户
     * @param userId 用户ID
     * @param unreadCount 未读数量
     */
    void pushUnreadCount(String userId, int unreadCount);
}
