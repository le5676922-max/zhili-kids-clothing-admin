package com.example.java.service.impl;

import com.example.java.dto.NotificationVO;
import com.example.java.service.NotificationPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * 站内通知 WebSocket 推送服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPushServiceImpl implements NotificationPushService {

    private final SimpMessagingTemplate messagingTemplate;

    private static final String CHANNEL_NOTIFICATION = "/topic/notification/user/";
    private static final String CHANNEL_UNREAD = "/topic/notification/unread/";

    @Override
    public void pushNotification(String userId, NotificationVO notification) {
        try {
            messagingTemplate.convertAndSend(CHANNEL_NOTIFICATION + userId, notification);
            log.debug("推送新通知成功: userId={}, notificationId={}", userId, notification.getId());
        } catch (Exception e) {
            log.warn("推送新通知失败: userId={}", userId, e);
        }
    }

    @Override
    public void pushUnreadCount(String userId, int unreadCount) {
        try {
            messagingTemplate.convertAndSend(CHANNEL_UNREAD + userId, unreadCount);
            log.debug("推送未读数量成功: userId={}, count={}", userId, unreadCount);
        } catch (Exception e) {
            log.warn("推送未读数量失败: userId={}", userId, e);
        }
    }
}
