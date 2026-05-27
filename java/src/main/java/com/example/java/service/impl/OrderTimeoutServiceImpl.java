package com.example.java.service.impl;

import com.example.java.entity.Order;
import com.example.java.mapper.OrderMapper;
import com.example.java.service.OrderService;
import com.example.java.service.OrderTimeoutService;
import com.example.java.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单超时服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderTimeoutServiceImpl implements OrderTimeoutService {

    private final OrderMapper orderMapper;
    private final OrderService orderService;
    private final ProductService productService;

    /**
     * 每5分钟检查一次超时订单
     */
    @Scheduled(fixedRate = 300000) // 5分钟
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processExpiredOrders() {
        log.info("开始检查超时未支付订单...");

        List<Order> expiredOrders = orderMapper.findExpiredPendingOrders(ORDER_TIMEOUT_MINUTES);
        if (expiredOrders.isEmpty()) {
            log.info("没有超时未支付的订单");
            return;
        }

        log.info("发现 {} 个超时未支付的订单", expiredOrders.size());

        for (Order order : expiredOrders) {
            try {
                // 取消订单并恢复库存
                orderService.cancelExpiredOrder(order.getId());
                log.info("订单 {} 已自动取消（超时未支付）", order.getId());
            } catch (Exception e) {
                log.error("处理超时订单 {} 失败: {}", order.getId(), e.getMessage());
            }
        }

        log.info("超时订单处理完成");
    }

    /**
     * 每小时检查一次待确认收货的订单
     */
    @Scheduled(fixedRate = 3600000) // 1小时
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processDeliveredOrders() {
        log.info("开始检查待确认收货订单...");

        List<Order> deliveredOrders = orderMapper.findDeliveredOrdersForAutoConfirm(AUTO_CONFIRM_DAYS);
        if (deliveredOrders.isEmpty()) {
            log.info("没有需要自动确认收货的订单");
            return;
        }

        log.info("发现 {} 个待确认收货的订单", deliveredOrders.size());

        for (Order order : deliveredOrders) {
            try {
                // 自动确认收货（使用订单买家ID，超时自动确认属于系统操作）
                orderService.confirmReceived(order.getId(), order.getUserId());
                log.info("订单 {} 已自动确认收货", order.getId());
            } catch (Exception e) {
                log.error("处理自动确认收货订单 {} 失败: {}", order.getId(), e.getMessage());
            }
        }

        log.info("自动确认收货处理完成");
    }
}
