package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.OrderVO;
import com.example.java.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 物流追踪公开接口（无需登录）
 */
@RestController
@RequestMapping("/api/logistics")
@RequiredArgsConstructor
public class LogisticsController {

    private final OrderService orderService;

    /**
     * 通过运单号查询物流信息（公开接口）
     * 前端供应链页的物流查询功能调用此接口
     */
    @GetMapping("/track")
    public R<OrderVO> track(@RequestParam String trackingNo) {
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
