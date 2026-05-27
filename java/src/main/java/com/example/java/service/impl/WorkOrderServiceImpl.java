package com.example.java.service.impl;

import com.example.java.dto.WorkOrderCreateRequest;
import com.example.java.dto.WorkOrderReplyRequest;
import com.example.java.entity.WorkOrder;
import com.example.java.entity.WorkOrderMessage;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.WorkOrderMapper;
import com.example.java.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 工单服务实现
 */
@Service
@RequiredArgsConstructor
public class WorkOrderServiceImpl implements WorkOrderService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final WorkOrderMapper workOrderMapper;

    @Override
    @Transactional
    public WorkOrder create(String userId, WorkOrderCreateRequest request) {
        String subject = request.getSubject() != null ? request.getSubject().trim() : "";
        if (subject.isEmpty()) {
            throw new BusinessException("请填写主题");
        }
        String content = request.getContent() != null ? request.getContent().trim() : "";
        String level = "低";
        if ("高".equals(request.getLevel()) || "中".equals(request.getLevel())) {
            level = request.getLevel();
        }
        String now = java.time.LocalDateTime.now().format(FORMATTER);
        String id = "WO" + System.currentTimeMillis() % 1000000;
        WorkOrder order = new WorkOrder();
        order.setId(id);
        order.setUserId(userId);
        order.setSubject(subject);
        order.setContent(content);
        order.setLevel(level);
        order.setStatus("待处理");
        order.setCreateTime(now);
        order.setLastReply(now);
        workOrderMapper.insert(order);
        // 首条内容只存 work_orders.content，messages 表在 getDetail 时补入一条虚拟记录
        return order;
    }

    @Override
    public WorkOrder getDetail(String orderId, String userId, boolean isAdmin) {
        WorkOrder order = workOrderMapper.findById(orderId);
        if (order == null) {
            throw new BusinessException(404, "工单不存在");
        }
        if (!order.getUserId().equals(userId) && !isAdmin) {
            throw new BusinessException(403, "无权限查看");
        }
        // 使用可变 List：MyBatis 在无数据时可能返回不可变空列表，直接 add 会抛异常
        List<WorkOrderMessage> messages = new ArrayList<>(workOrderMapper.findMessagesByOrderId(orderId));
        // 首条内容存于 work_orders.content，在此补为虚拟首条消息，保持 messages 列表完整
        if (order.getContent() != null && !order.getContent().isEmpty()) {
            WorkOrderMessage first = new WorkOrderMessage();
            first.setRole("user");
            first.setContent(order.getContent());
            first.setTime(order.getCreateTime());
            messages.add(0, first);
        }
        order.setMessages(messages);
        return order;
    }

    @Override
    public List<WorkOrder> listByUserId(String userId) {
        return workOrderMapper.findByUserId(userId);
    }

    @Override
    public List<WorkOrder> listAll() {
        return workOrderMapper.findAll();
    }

    @Override
    @Transactional
    public Map<String, String> reply(String orderId, String userId, boolean isAdmin, WorkOrderReplyRequest request) {
        WorkOrder order = workOrderMapper.findById(orderId);
        if (order == null) {
            throw new BusinessException(404, "工单不存在");
        }
        if (!order.getUserId().equals(userId) && !isAdmin) {
            throw new BusinessException(403, "无权限回复");
        }
        String content = request.getContent() != null ? request.getContent().trim() : "";
        if (content.isEmpty()) {
            throw new BusinessException("请填写回复内容");
        }
        String time = java.time.LocalDateTime.now().format(FORMATTER);
        WorkOrderMessage msg = new WorkOrderMessage();
        msg.setOrderId(orderId);
        msg.setRole(isAdmin ? "admin" : "user");
        msg.setContent(content);
        msg.setTime(time);
        workOrderMapper.insertMessage(msg);
        workOrderMapper.updateLastReply(orderId, time);
        // ========== 完善状态流转 ==========
        // 已关闭的工单不能回复
        if ("已关闭".equals(order.getStatus())) {
            throw new BusinessException(400, "工单已关闭，无法回复");
        }
        // 管理员首次回复：待处理 -> 处理中
        if (isAdmin && "待处理".equals(order.getStatus())) {
            workOrderMapper.updateStatus(orderId, "处理中");
        }
        // 用户回复后，工单保持当前状态不变，不回退到"待处理"
        return Map.of("time", time);
    }

    @Override
    @Transactional
    public void close(String orderId, String userId) {
        WorkOrder order = workOrderMapper.findById(orderId);
        if (order == null) {
            throw new BusinessException(404, "工单不存在");
        }
        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权限关闭该工单");
        }
        if ("已关闭".equals(order.getStatus())) {
            throw new BusinessException(400, "工单已关闭");
        }
        workOrderMapper.updateStatus(orderId, "已关闭");
    }
}
