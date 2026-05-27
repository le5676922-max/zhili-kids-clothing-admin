package com.example.java.service.impl;

import com.example.java.dto.OrderVO;
import com.example.java.dto.RefundRequest;
import com.example.java.dto.RefundVO;
import com.example.java.entity.Order;
import com.example.java.entity.Refund;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.OrderMapper;
import com.example.java.mapper.OrderItemMapper;
import com.example.java.mapper.ProductMapper;
import com.example.java.mapper.RefundMapper;
import com.example.java.service.NotificationService;
import com.example.java.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * 退款服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundMapper refundMapper;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ProductMapper productMapper;
    private final NotificationService notificationService;

    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_APPROVED = "approved";
    private static final String STATUS_REJECTED = "rejected";
    private static final String STATUS_COMPLETED = "completed";
    private static final String STATUS_CANCELLED = "cancelled";

    private static final String ORDER_STATUS_PAID = "paid";
    private static final String ORDER_STATUS_SHIPPED = "shipped";
    private static final String ORDER_STATUS_COMPLETED = "completed";

    @Override
    @Transactional
    public RefundVO createRefund(RefundRequest request, String userId) {
        // 验证参数
        if (request.getOrderId() == null || request.getOrderId().isEmpty()) {
            throw new BusinessException("订单ID不能为空");
        }
        if (request.getReason() == null || request.getReason().isEmpty()) {
            throw new BusinessException("请选择退款原因");
        }

        // 查询订单
        var order = orderMapper.selectById(request.getOrderId());
        if (order == null) {
            throw new BusinessException("订单不存在");
        }

        // 验证订单归属
        if (!userId.equals(order.getUserId())) {
            throw new BusinessException("无权对该订单申请退款");
        }

        // 验证订单状态：已支付、已发货、已完成可以申请退款
        String orderStatus = order.getStatus();
        if (!ORDER_STATUS_PAID.equals(orderStatus) && !ORDER_STATUS_SHIPPED.equals(orderStatus) && !ORDER_STATUS_COMPLETED.equals(orderStatus)) {
            throw new BusinessException("该订单状态不允许申请退款");
        }

        // 检查是否有待处理的退款申请
        int pendingCount = refundMapper.countPendingByOrderId(request.getOrderId());
        if (pendingCount > 0) {
            throw new BusinessException("该订单已有待处理的退款申请");
        }

        // 获取卖家ID
        String sellerId = orderMapper.getSellerIdByOrderId(request.getOrderId());
        if (sellerId == null) {
            throw new BusinessException("无法获取订单卖家信息");
        }

        // 生成退款单号
        String refundNo = "R" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();

        // 构建退款实体
        Refund refund = new Refund();
        refund.setRefundNo(refundNo);
        refund.setOrderId(request.getOrderId());
        refund.setUserId(userId);
        refund.setSellerId(sellerId);
        refund.setRefundAmount(order.getTotalAmount()); // 默认全额退款
        refund.setRefundType(request.getRefundType() != null ? request.getRefundType() : "refund");
        refund.setReason(request.getReason());
        refund.setDescription(request.getDescription());
        refund.setStatus(STATUS_PENDING);

        refundMapper.insert(refund);

        // 更新订单状态为退款中（如果订单是已支付或已发货状态）
        if (ORDER_STATUS_PAID.equals(orderStatus) || ORDER_STATUS_SHIPPED.equals(orderStatus)) {
            orderMapper.updateStatus(request.getOrderId(), "refund_pending");
        }

        RefundVO vo = refundMapper.selectById(refund.getId());
        vo.setStatusText("待审核");

        // 通知卖家有新的退款申请
        try {
            notificationService.notify(
                sellerId,
                "refund_request",
                "新的退款申请",
                "订单 " + request.getOrderId() + " 提交了退款申请，退款编号：" + refundNo,
                refund.getId().intValue(),
                "refund"
            );
        } catch (Exception e) {
            log.warn("退款申请通知失败", e);
        }

        return vo;
    }

    @Override
    public List<RefundVO> getUserRefunds(String userId) {
        List<RefundVO> refunds = refundMapper.selectByUserId(userId);
        refunds.forEach(this::setStatusText);
        return refunds;
    }

    @Override
    public List<RefundVO> getSellerRefunds(String sellerId) {
        List<RefundVO> refunds = refundMapper.selectBySellerId(sellerId);
        refunds.forEach(this::setStatusText);
        return refunds;
    }

    private void setStatusText(RefundVO refund) {
        String status = refund.getStatus();
        switch (status) {
            case STATUS_PENDING -> refund.setStatusText("待审核");
            case STATUS_APPROVED -> refund.setStatusText("审核通过");
            case STATUS_REJECTED -> refund.setStatusText("审核拒绝");
            case STATUS_COMPLETED -> refund.setStatusText("已完成");
            case STATUS_CANCELLED -> refund.setStatusText("已取消");
            default -> refund.setStatusText(status);
        }
    }

    @Override
    public RefundVO getRefundById(Long id) {
        RefundVO refund = refundMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }
        return refund;
    }

    @Override
    public RefundVO getRefundByRefundNo(String refundNo) {
        RefundVO refund = refundMapper.selectByRefundNo(refundNo);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }
        return refund;
    }

    @Override
    @Transactional
    public void approveRefund(Long id, String sellerNote, String sellerId) {
        RefundVO refund = refundMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }

        // 验证商家权限
        if (!sellerId.equals(refund.getSellerId())) {
            throw new BusinessException("无权审核该退款申请");
        }

        // 只有待审核状态可以审核
        if (!STATUS_PENDING.equals(refund.getStatus())) {
            throw new BusinessException("只有待审核的退款申请可以审核");
        }

        refundMapper.updateStatus(id, STATUS_APPROVED, sellerNote);

        // 通知买家退款审核通过
        try {
            notificationService.notify(
                refund.getUserId(),
                "refund_approved",
                "退款审核通过",
                "退款申请 " + refund.getRefundNo() + " 已审核通过",
                id.intValue(),
                "refund"
            );
        } catch (Exception e) {
            log.warn("退款审核通过通知失败", e);
        }
    }

    @Override
    @Transactional
    public void rejectRefund(Long id, String reason, String sellerId) {
        RefundVO refund = refundMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }

        // 验证商家权限
        if (!sellerId.equals(refund.getSellerId())) {
            throw new BusinessException("无权审核该退款申请");
        }

        // 只有待审核状态可以拒绝
        if (!STATUS_PENDING.equals(refund.getStatus())) {
            throw new BusinessException("只有待审核的退款申请可以拒绝");
        }

        refundMapper.updateStatus(id, STATUS_REJECTED, reason);

        // 恢复订单状态：根据订单的实际字段推断退款前的状态
        restoreOrderStatusAfterRefund(refund.getOrderId());

        // 通知买家退款被拒绝
        try {
            String rejectReason = (reason != null && !reason.isEmpty()) ? reason : "未通过审核";
            notificationService.notify(
                refund.getUserId(),
                "refund_rejected",
                "退款申请被拒绝",
                "退款申请 " + refund.getRefundNo() + " 已被拒绝，原因：" + rejectReason,
                id.intValue(),
                "refund"
            );
        } catch (Exception e) {
            log.warn("退款拒绝通知失败", e);
        }
    }

    @Override
    @Transactional
    public void cancelRefund(Long id, String userId) {
        RefundVO refund = refundMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }

        // 验证用户权限
        if (!userId.equals(refund.getUserId())) {
            throw new BusinessException("无权取消该退款申请");
        }

        // 只有待审核状态可以取消
        if (!STATUS_PENDING.equals(refund.getStatus())) {
            throw new BusinessException("只有待审核的退款申请可以取消");
        }

        refundMapper.updateStatus(id, STATUS_CANCELLED, "用户主动取消");

        // 恢复订单状态：根据订单的实际字段推断退款前的状态
        restoreOrderStatusAfterRefund(refund.getOrderId());
    }

    @Override
    @Transactional
    public void completeRefund(Long id) {
        RefundVO refund = refundMapper.selectById(id);
        if (refund == null) {
            throw new BusinessException("退款申请不存在");
        }

        // 只有审核通过状态可以完成
        if (!STATUS_APPROVED.equals(refund.getStatus())) {
            throw new BusinessException("只有审核通过的退款可以完成");
        }

        refundMapper.updateStatus(id, STATUS_COMPLETED, "退款完成");

        // 更新订单状态为已取消
        orderMapper.updateStatus(refund.getOrderId(), "cancelled");

        // 恢复商品库存
        try {
            List<com.example.java.dto.OrderItemVO> items = orderItemMapper.selectByOrderId(refund.getOrderId());
            if (items != null) {
                for (com.example.java.dto.OrderItemVO item : items) {
                    productMapper.restoreStock(item.getProductId(), item.getQuantity());
                }
            }
        } catch (Exception e) {
            log.error("退款完成时恢复库存失败: refundId={}, orderId={}", id, refund.getOrderId(), e);
        }

        // 通知买家退款已完成
        try {
            notificationService.notify(
                refund.getUserId(),
                "refund_completed",
                "退款已完成",
                "退款申请 " + refund.getRefundNo() + " 已完成",
                id.intValue(),
                "refund"
            );
        } catch (Exception e) {
            log.warn("退款完成通知失败", e);
        }
    }

    /**
     * 退款被拒绝/取消后，根据订单的时间字段推断退款前的状态并恢复
     * 不再依赖 RefundVO.orderStatus（该值来自 LEFT JOIN，可能已被其他操作修改）
     */
    private void restoreOrderStatusAfterRefund(String orderId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) return;

        String currentStatus = order.getStatus();
        if (!"refund_pending".equals(currentStatus)) {
            // 订单状态已被其他操作修改，不再覆盖
            return;
        }

        // 根据订单时间字段推断退款前的最新状态
        if (order.getShippedTime() != null) {
            orderMapper.updateStatus(orderId, ORDER_STATUS_SHIPPED);
        } else if (order.getPaidTime() != null) {
            orderMapper.updateStatus(orderId, ORDER_STATUS_PAID);
        } else {
            orderMapper.updateStatus(orderId, ORDER_STATUS_COMPLETED);
        }
    }
}
