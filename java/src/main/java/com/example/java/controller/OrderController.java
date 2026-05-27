package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.OrderCreateRequest;
import com.example.java.dto.OrderVO;
import com.example.java.entity.User;
import com.example.java.service.OrderService;
import com.example.java.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new com.example.java.exception.BusinessException("请先登录");
        }
        return user.getId();
    }

    /**
     * 创建订单（待支付状态）
     */
    @PostMapping
    public R<OrderVO> create(@Valid @RequestBody OrderCreateRequest request) {
        String userId = getCurrentUserId();
        OrderVO order = orderService.create(userId, request);
        // 订单创建时为待支付状态，等待用户确认支付
        return R.success("订单创建成功", order);
    }

    /**
     * 订单列表（买家：我的订单）
     */
    @GetMapping
    public R<List<OrderVO>> list() {
        String userId = getCurrentUserId();
        List<OrderVO> list = orderService.listByUserId(userId);
        return R.success(list);
    }

    /**
     * 销售订单列表（商家：我卖出的订单，含买家收货信息与状态）
     */
    @GetMapping("/sales")
    public R<List<OrderVO>> listSales() {
        String sellerId = getCurrentUserId();
        List<OrderVO> list = orderService.listSalesBySellerId(sellerId);
        return R.success(list);
    }

    /**
     * 订单详情
     */
    @GetMapping("/{id}")
    public R<OrderVO> getById(@PathVariable String id) {
        OrderVO order = orderService.getById(id);
        if (order == null) {
            return R.error("订单不存在");
        }
        return R.success(order);
    }

    /**
     * 模拟支付（支付成功后扣减库存、累加销量、清空购物车）
     */
    @PostMapping("/{id}/pay")
    public R<OrderVO> pay(@PathVariable String id) {
        String userId = getCurrentUserId();
        OrderVO order = orderService.payOrder(id, userId);
        return R.success("支付成功", order);
    }

    /**
     * 商家发货：填写快递单号，订单状态改为已发货
     */
    @PostMapping("/{id}/ship")
    public R<OrderVO> ship(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        String trackingNo = body != null ? body.get("trackingNo") : null;
        if (trackingNo == null || trackingNo.trim().isEmpty()) {
            return R.error(400, "请填写快递单号");
        }
        String sellerId = getCurrentUserId();
        orderService.shipOrder(id, trackingNo, sellerId);
        return R.success("发货成功", orderService.getById(id));
    }

    /**
     * 确认收货
     */
    @PostMapping("/{id}/confirm")
    public R<OrderVO> confirm(@PathVariable String id) {
        String userId = getCurrentUserId();
        OrderVO order = orderService.getById(id);
        if (order == null) {
            return R.error("订单不存在");
        }
        if (!userId.equals(order.getUserId())) {
            return R.error("无权操作，只有买家可以确认收货");
        }
        orderService.confirmReceived(id, userId);
        return R.success("确认收货成功", orderService.getById(id));
    }

    /**
     * 取消订单（仅 pending 状态可取消，无需恢复库存）
     */
    @PostMapping("/{id}/cancel")
    public R<Void> cancel(@PathVariable String id) {
        String userId = getCurrentUserId();
        orderService.cancelOrder(id, userId);
        return R.success("订单已取消", null);
    }

    /**
     * 物流查询：通过运单号查询订单物流信息（公开接口）
     */
    @GetMapping("/track")
    public R<OrderVO> trackByTrackingNo(@RequestParam String trackingNo) {
        if (trackingNo == null || trackingNo.trim().isEmpty()) {
            return R.error(400, "运单号不能为空");
        }
        OrderVO order = orderService.getByTrackingNo(trackingNo.trim());
        if (order == null) {
            return R.error("未找到该运单号的订单");
        }
        return R.success(order);
    }
}
