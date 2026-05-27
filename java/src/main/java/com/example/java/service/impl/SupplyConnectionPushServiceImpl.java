package com.example.java.service.impl;

import com.example.java.dto.SupplyConnectionVO;
import com.example.java.service.SupplyConnectionPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 供需对接 WebSocket 推送服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupplyConnectionPushServiceImpl implements SupplyConnectionPushService {

    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 频道前缀：/topic/connection/user/{userId} */
    private static final String CHANNEL_USER = "/topic/connection/user/";

    /** 频道：所有连接变更广播 */
    private static final String CHANNEL_ALL = "/topic/connection/all";

    @Override
    public void pushNewConnection(String targetUserId, SupplyConnectionVO connection) {
        try {
            SupplyConnectionNotification notification = new SupplyConnectionNotification();
            notification.setType("new_connection");
            notification.setConnectionId(connection.getId());
            notification.setConnectionNo(connection.getConnectionId());
            notification.setStatus(connection.getStatus());
            notification.setDemandId(connection.getDemandId());
            notification.setSupplyId(connection.getSupplyId());
            notification.setDemandTitle(connection.getDemandTitle());
            notification.setSupplyTitle(connection.getSupplyTitle());
            notification.setDemandCompanyName(connection.getDemandCompanyName());
            notification.setSupplyCompanyName(connection.getSupplyCompanyName());
            notification.setApplicantCompanyName(connection.getApplicantCompanyName());
            notification.setApplicantContactName(connection.getApplicantContactName());
            notification.setApplicantContactPhone(connection.getApplicantContactPhone());
            notification.setNotes(connection.getNotes());
            notification.setCreatedAt(connection.getCreatedAt() != null
                    ? connection.getCreatedAt().format(FMT) : LocalDateTime.now().format(FMT));
            notification.setTimestamp(System.currentTimeMillis());

            // 推送给目标用户
            messagingTemplate.convertAndSend(CHANNEL_USER + targetUserId, notification);

            // 广播给所有管理员（如果有）
            messagingTemplate.convertAndSend(CHANNEL_ALL, notification);

            log.info("【供需对接】推送新对接通知成功: targetUserId={}, connectionId={}",
                    targetUserId, connection.getConnectionId());
        } catch (Exception e) {
            log.error("【供需对接】推送新对接通知失败: targetUserId={}", targetUserId, e);
        }
    }

    @Override
    public void pushStatusChanged(String targetUserId, Integer connectionId, String newStatus, String connectionNo) {
        try {
            SupplyConnectionNotification notification = new SupplyConnectionNotification();
            notification.setType("status_changed");
            notification.setConnectionId(connectionId);
            notification.setConnectionNo(connectionNo);
            notification.setStatus(newStatus);
            notification.setTimestamp(System.currentTimeMillis());

            // 状态文字
            String statusText = "completed".equals(newStatus) ? "已完成" : "cancelled".equals(newStatus) ? "已撤销" : newStatus;
            notification.setStatusText(statusText);

            // 推送给目标用户
            messagingTemplate.convertAndSend(CHANNEL_USER + targetUserId, notification);

            // 广播给所有管理员
            messagingTemplate.convertAndSend(CHANNEL_ALL, notification);

            log.info("【供需对接】推送状态变更通知成功: targetUserId={}, connectionId={}, newStatus={}",
                    targetUserId, connectionId, newStatus);
        } catch (Exception e) {
            log.error("【供需对接】推送状态变更通知失败: targetUserId={}", targetUserId, e);
        }
    }

    /**
     * 供需对接通知消息体
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SupplyConnectionNotification implements java.io.Serializable {
        private static final long serialVersionUID = 1L;

        /** 消息类型：new_connection / status_changed */
        private String type;

        /** 对接记录ID */
        private Integer connectionId;

        /** 对接编号 */
        private String connectionNo;

        /** 当前状态 */
        private String status;

        /** 状态文字（可选） */
        private String statusText;

        /** 关联的需求ID */
        private Integer demandId;

        /** 关联的供应ID */
        private Integer supplyId;

        /** 需求标题 */
        private String demandTitle;

        /** 供应标题 */
        private String supplyTitle;

        /** 需求方企业名称 */
        private String demandCompanyName;

        /** 供应方企业名称 */
        private String supplyCompanyName;

        /** 申请方企业名称 */
        private String applicantCompanyName;

        /** 申请方联系人 */
        private String applicantContactName;

        /** 申请方联系电话 */
        private String applicantContactPhone;

        /** 对接说明 */
        private String notes;

        /** 创建时间 */
        private String createdAt;

        /** 时间戳 */
        private Long timestamp;
    }
}
