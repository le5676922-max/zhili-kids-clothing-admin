package com.example.java.service;

import com.example.java.dto.SupplyConnectionVO;

/**
 * 供需对接 WebSocket 推送服务
 */
public interface SupplyConnectionPushService {

    /**
     * 推送新对接通知给需求/供应发布者
     * @param targetUserId 接收通知的用户ID
     * @param connection 对接记录信息
     */
    void pushNewConnection(String targetUserId, SupplyConnectionVO connection);

    /**
     * 推送对接状态变更通知
     * @param targetUserId 接收通知的用户ID
     * @param connectionId 对接记录ID
     * @param newStatus 新状态
     * @param connectionNo 对接编号
     */
    void pushStatusChanged(String targetUserId, Integer connectionId, String newStatus, String connectionNo);
}
