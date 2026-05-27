package com.example.java.service.impl;

import com.example.java.dto.*;
import com.example.java.dto.admin.AdminOrderPageResult;
import com.example.java.dto.admin.AdminOrderRowDTO;
import com.example.java.entity.Order;
import com.example.java.entity.OrderItem;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.OrderItemMapper;
import com.example.java.mapper.OrderMapper;
import com.example.java.mapper.ProductMapper;
import com.example.java.service.CartService;
import com.example.java.service.NotificationService;
import com.example.java.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ProductMapper productMapper;
    private final CartService cartService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public OrderVO create(String userId, OrderCreateRequest request) {
        List<OrderItem> orderItems = new ArrayList<>();
        AtomicReference<BigDecimal> totalAmount = new AtomicReference<>(BigDecimal.ZERO);

        for (OrderCreateRequest.CartItemRequest itemRequest : request.getItems()) {
            ProductVO product = productMapper.selectById(itemRequest.getProductId());
            if (product == null) {
                throw new BusinessException("产品不存在: " + itemRequest.getProductId());
            }
            // 检查库存是否充足
            if (product.getStock() == null || product.getStock() < itemRequest.getQuantity()) {
                throw new BusinessException("商品[" + product.getName() + "]库存不足，当前库存：" + (product.getStock() == null ? 0 : product.getStock()));
            }

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount.updateAndGet(v -> v.add(subtotal));

            OrderItem item = new OrderItem();
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setProductImage(product.getImageUrl());
            item.setPrice(product.getPrice());
            item.setQuantity(itemRequest.getQuantity());
            item.setSubtotal(subtotal);
            item.setSelectedColor(itemRequest.getSelectedColor());
            item.setSelectedSize(itemRequest.getSelectedSize());
            orderItems.add(item);
        }

        String orderId = generateOrderId();
        Order order = new Order();
        order.setId(orderId);
        order.setUserId(userId);
        order.setTotalAmount(totalAmount.get());
        order.setStatus("pending");
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setReceiverAddress(request.getReceiverAddress());
        order.setRemark(request.getRemark());
        order.setCreatedAt(LocalDateTime.now());

        orderMapper.insert(order);

        for (OrderItem item : orderItems) {
            item.setOrderId(orderId);
        }
        orderItemMapper.insertBatch(orderItems);

        // 清空购物车中对应的商品
        List<Integer> cartIds = new ArrayList<>();
        for (OrderCreateRequest.CartItemRequest itemRequest : request.getItems()) {
            if (itemRequest.getCartId() != null) {
                cartIds.add(itemRequest.getCartId());
            }
        }
        if (!cartIds.isEmpty()) {
            cartService.clearCart(userId, cartIds);
        }

        return getById(orderId);
    }

    @Override
    public OrderVO getById(String orderId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) {
            return null;
        }
        order.setItems(orderItemMapper.selectByOrderId(orderId));
        order.setStatusText(getStatusText(order.getStatus()));
        return order;
    }

    @Override
    public OrderVO getByTrackingNo(String trackingNo) {
        if (trackingNo == null || trackingNo.trim().isEmpty()) return null;
        OrderVO order = orderMapper.selectByTrackingNo(trackingNo.trim());
        if (order == null) return null;
        order.setItems(orderItemMapper.selectByOrderId(order.getId()));
        order.setStatusText(getStatusText(order.getStatus()));
        return order;
    }

    @Override
    public List<OrderVO> listByUserId(String userId) {
        List<OrderVO> orders = orderMapper.selectByUserId(userId);
        for (OrderVO order : orders) {
            order.setItems(orderItemMapper.selectByOrderId(order.getId()));
            order.setStatusText(getStatusText(order.getStatus()));
        }
        return orders;
    }

    @Override
    public List<OrderVO> listSalesBySellerId(String sellerId) {
        List<OrderVO> orders = orderMapper.selectSalesBySellerId(sellerId);
        for (OrderVO order : orders) {
            order.setItems(orderItemMapper.selectByOrderId(order.getId()));
            order.setStatusText(getStatusText(order.getStatus()));
        }
        return orders;
    }

    @Override
    @Transactional
    public void shipOrder(String orderId, String trackingNo, String sellerId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (!"paid".equals(order.getStatus())) {
            throw new BusinessException("只有待发货订单可以填写快递单号");
        }
        List<OrderVO> sellerOrders = orderMapper.selectSalesBySellerId(sellerId);
        boolean belongs = sellerOrders.stream().anyMatch(o -> orderId.equals(o.getId()));
        if (!belongs) {
            throw new BusinessException("无权操作该订单");
        }
        orderMapper.updateShip(orderId, trackingNo != null ? trackingNo.trim() : null);
    }

    @Override
    public void updateStatus(String orderId, String status) {
        orderMapper.updateStatus(orderId, status);
    }

    /**
     * 支付订单：扣减库存、累加销量、清空购物车
     */
    @Override
    @Transactional
    public OrderVO payOrder(String orderId, String userId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (!userId.equals(order.getUserId())) {
            throw new BusinessException("无权操作该订单");
        }
        if ("paid".equals(order.getStatus())) {
            throw new BusinessException("订单已支付");
        }
        if ("cancelled".equals(order.getStatus())) {
            throw new BusinessException("订单已取消，无法支付");
        }
        if ("completed".equals(order.getStatus())) {
            throw new BusinessException("订单已完成，无法支付");
        }

        // 扣减库存、累加销量
        List<com.example.java.dto.OrderItemVO> items = orderItemMapper.selectByOrderId(orderId);
        for (com.example.java.dto.OrderItemVO item : items) {
            int affected = productMapper.decrementStock(item.getProductId(), item.getQuantity());
            if (affected <= 0) {
                throw new BusinessException("商品[" + item.getProductName() + "]库存不足，支付失败");
            }
        }

        // 清空购物车中对应的商品（基于产品ID匹配）
        List<Integer> cartIds = new ArrayList<>();
        for (com.example.java.dto.OrderItemVO item : items) {
            cartIds.addAll(cartService.findCartIdsByUserIdAndProductId(userId, item.getProductId()));
        }
        if (!cartIds.isEmpty()) {
            cartService.clearCart(userId, cartIds);
        }

        orderMapper.updateStatus(orderId, "paid");
        return getById(orderId);
    }

    /**
     * 取消订单（仅 pending 状态可取消，pending 时未扣库存，无需恢复）
     * 若将来支持"已支付订单取消退款"场景，在此方法中增加 paid 状态处理即可
     */
    @Override
    @Transactional
    public void cancelOrder(String orderId, String userId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (!userId.equals(order.getUserId())) {
            throw new BusinessException("无权操作该订单");
        }
        if (!"pending".equals(order.getStatus())) {
            throw new BusinessException("只有待支付订单可以取消");
        }
        // pending 状态时未扣库存，无需恢复
        orderMapper.updateStatus(orderId, "cancelled");
    }

    /**
     * 取消超时订单（内部使用，不检查用户权限，用于定时任务）
     */
    @Override
    @Transactional
    public void cancelExpiredOrder(String orderId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (!"pending".equals(order.getStatus())) {
            // 只有pending状态才能取消
            return;
        }
        orderMapper.updateStatus(orderId, "cancelled");
    }

    /**
     * 确认收货
     */
    @Override
    @Transactional
    public void confirmReceived(String orderId, String userId) {
        OrderVO order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (!userId.equals(order.getUserId())) {
            throw new BusinessException("无权操作该订单");
        }
        if (!"shipped".equals(order.getStatus())) {
            throw new BusinessException("订单未发货，无法确认收货");
        }
        orderMapper.updateStatus(orderId, "completed");

        // 通知卖家订单已完成
        try {
            String sellerId = order.getSellerId();
            if (sellerId != null) {
                notificationService.notify(
                    sellerId,
                    "order_completed",
                    "订单已完成",
                    "订单 " + orderId + " 已确认收货",
                    null,
                    "order"
                );
            }
        } catch (Exception e) {
            log.warn("订单确认收货通知失败: orderId={}", orderId, e);
        }
    }

    @Override
    public void clearCart(String userId, List<Integer> cartIds) {
        for (Integer cartId : cartIds) {
            cartService.delete(userId, cartId);
        }
    }

    private String generateOrderId() {
        return "ORD" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + String.format("%04d", (int) (Math.random() * 10000));
    }

    private String getStatusText(String status) {
        return switch (status) {
            case "pending" -> "待支付";
            case "paid" -> "待发货";
            case "shipped" -> "已发货";
            case "completed" -> "已完成";
            case "cancelled" -> "已取消";
            case "refund_pending" -> "退款中";
            case "refunded" -> "已退款";
            default -> status;
        };
    }

    @Override
    public AdminOrderPageResult listOrdersForAdmin(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = orderMapper.countForAdmin();
        List<AdminOrderRowDTO> list = orderMapper.selectAllForAdmin(offset, limit);
        for (AdminOrderRowDTO row : list) {
            row.setOrderStatusText(getStatusText(row.getOrderStatus()));
        }
        return new AdminOrderPageResult(list, total);
    }
}
