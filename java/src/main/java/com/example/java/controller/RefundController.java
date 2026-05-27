package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.RefundRequest;
import com.example.java.dto.RefundVO;
import com.example.java.entity.User;
import com.example.java.service.RefundService;
import com.example.java.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 退款Controller
 */
@RestController
@RequestMapping("/api/auth/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;
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
     * 获取当前用户的退款列表（买家视角）
     */
    @GetMapping
    public R<List<RefundVO>> getMyRefunds() {
        String userId = getCurrentUserId();
        List<RefundVO> refunds = refundService.getUserRefunds(userId);
        return R.success(refunds);
    }

    /**
     * 获取退款详情
     */
    @GetMapping("/{id}")
    public R<RefundVO> getRefundDetail(@PathVariable Long id) {
        String userId = getCurrentUserId();
        RefundVO refund = refundService.getRefundById(id);
        if (!userId.equals(refund.getUserId()) && !userId.equals(refund.getSellerId())) {
            return R.error("无权查看该退款申请");
        }
        return R.success(refund);
    }

    /**
     * 提交退款申请
     */
    @PostMapping
    public R<RefundVO> createRefund(@RequestBody RefundRequest refundRequest) {
        String userId = getCurrentUserId();
        RefundVO refund = refundService.createRefund(refundRequest, userId);
        return R.success(refund);
    }

    /**
     * 取消退款申请
     */
    @DeleteMapping("/{id}")
    public R<Void> cancelRefund(@PathVariable Long id) {
        String userId = getCurrentUserId();
        refundService.cancelRefund(id, userId);
        return R.success(null);
    }

    /**
     * 获取商家的退款列表（卖家视角）
     */
    @GetMapping("/seller")
    public R<List<RefundVO>> getSellerRefunds() {
        String sellerId = getCurrentUserId();
        List<RefundVO> refunds = refundService.getSellerRefunds(sellerId);
        return R.success(refunds);
    }

    /**
     * 商家审核通过退款
     */
    @PostMapping("/{id}/approve")
    public R<Void> approveRefund(@PathVariable Long id,
                                 @RequestParam(required = false) String sellerNote) {
        String currentUserId = getCurrentUserId();
        refundService.approveRefund(id, sellerNote, currentUserId);
        return R.success(null);
    }

    /**
     * 商家拒绝退款
     */
    @PostMapping("/{id}/reject")
    public R<Void> rejectRefund(@PathVariable Long id,
                                @RequestParam(required = false) String reason) {
        String currentUserId = getCurrentUserId();
        refundService.rejectRefund(id, reason, currentUserId);
        return R.success(null);
    }

    /**
     * 完成退款（模拟）
     */
    @PostMapping("/{id}/complete")
    public R<Void> completeRefund(@PathVariable Long id) {
        refundService.completeRefund(id);
        return R.success(null);
    }
}
