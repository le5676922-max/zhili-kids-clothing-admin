package com.example.java.service;

import com.example.java.entity.Order;

/**
 * 订单超时服务
 */
public interface OrderTimeoutService {

    /**
     * 处理超时未支付的订单
     * 取消超过30分钟未支付的订单
     */
    void processExpiredOrders();

    /**
     * 自动确认收货
     * 发货超过7天未确认收货的订单自动确认
     */
    void processDeliveredOrders();

    /**
     * 订单超时时间（分钟）
     */
    int ORDER_TIMEOUT_MINUTES = 30;

    /**
     * 自动确认收货时间（天）
     */
    int AUTO_CONFIRM_DAYS = 7;
}
