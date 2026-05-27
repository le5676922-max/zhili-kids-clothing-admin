package com.example.java.service;

import com.example.java.dto.NotificationVO;

import java.util.List;

/**
 * 站内通知服务
 */
public interface NotificationService {

    /**
     * 发送一条通知
     * @param userId       接收人
     * @param type         通知类型
     * @param title        标题
     * @param content      内容摘要
     * @param relatedId    关联业务ID
     * @param relatedType  关联业务类型：connection / job_application
     */
    void notify(String userId, String type, String title, String content,
                Integer relatedId, String relatedType);

    /** 查询某用户所有通知 */
    List<NotificationVO> listByUser(String userId);

    /** 查询某用户未读数量 */
    int unreadCount(String userId);

    /** 标记单条通知为已读 */
    void markAsRead(Long notificationId, String userId);

    /** 标记所有通知为已读 */
    void markAllAsRead(String userId);
}
