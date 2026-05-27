package com.example.java.service.impl;

import com.example.java.dto.NotificationVO;
import com.example.java.entity.Notification;
import com.example.java.mapper.NotificationMapper;
import com.example.java.service.NotificationPushService;
import com.example.java.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationPushService notificationPushService;

    @Override
    public void notify(String userId, String type, String title, String content,
                       Integer relatedId, String relatedType) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setContent(content);
        n.setRelatedId(relatedId);
        n.setRelatedType(relatedType);
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationMapper.insert(n);

        // WebSocket 实时推送
        try {
            NotificationVO vo = new NotificationVO();
            vo.setId(n.getId());
            vo.setUserId(n.getUserId());
            vo.setType(n.getType());
            vo.setTitle(n.getTitle());
            vo.setContent(n.getContent());
            vo.setRelatedId(n.getRelatedId());
            vo.setRelatedType(n.getRelatedType());
            vo.setIsRead(n.getIsRead());
            vo.setCreatedAt(n.getCreatedAt());
            vo.setTargetUrl(buildTargetUrl(n.getType(), n.getRelatedId()));
            notificationPushService.pushNotification(userId, vo);

            int unreadCount = notificationMapper.countUnread(userId);
            notificationPushService.pushUnreadCount(userId, unreadCount);
        } catch (Exception e) {
            log.warn("通知 WebSocket 推送失败: userId={}", userId, e);
        }
    }

    /**
     * 根据通知类型和关联ID计算跳转URL
     */
    private String buildTargetUrl(String type, Integer relatedId) {
        if (type == null) return null;
        switch (type) {
            case "supply_connection_created":
            case "connection_status_changed":
                return "pages/supply-chain.html";
            case "job_application_received":
                return "pages/recruitment-resumes.html";
            case "job_application_status_changed":
                return "pages/job-info.html";
            case "order_completed":
                return "pages/orders.html";
            case "refund_request":
                return "pages/refund-manage.html";
            case "refund_approved":
            case "refund_rejected":
            case "refund_completed":
                return "pages/refunds.html";
            default:
                return null;
        }
    }

    @Override
    public List<NotificationVO> listByUser(String userId) {
        List<NotificationVO> list = notificationMapper.selectByUserId(userId);
        if (list != null) {
            for (NotificationVO vo : list) {
                vo.setTargetUrl(buildTargetUrl(vo.getType(), vo.getRelatedId()));
            }
        }
        return list;
    }

    @Override
    public int unreadCount(String userId) {
        return notificationMapper.countUnread(userId);
    }

    @Override
    public void markAsRead(Long notificationId, String userId) {
        if (notificationId != null && userId != null) {
            notificationMapper.markAsRead(notificationId, userId);
        }
    }

    @Override
    public void markAllAsRead(String userId) {
        notificationMapper.markAllAsRead(userId);
    }
}
