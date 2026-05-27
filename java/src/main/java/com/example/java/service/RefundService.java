package com.example.java.service;

import com.example.java.dto.RefundRequest;
import com.example.java.dto.RefundVO;

import java.util.List;

/**
 * 退款服务接口
 */
public interface RefundService {

    /**
     * 用户提交退款申请
     */
    RefundVO createRefund(RefundRequest request, String userId);

    /**
     * 获取用户的退款列表（买家视角）
     */
    List<RefundVO> getUserRefunds(String userId);

    /**
     * 获取商家的退款列表（卖家视角）
     */
    List<RefundVO> getSellerRefunds(String sellerId);

    /**
     * 获取退款详情
     */
    RefundVO getRefundById(Long id);

    /**
     * 获取退款详情（根据退款单号）
     */
    RefundVO getRefundByRefundNo(String refundNo);

    /**
     * 商家审核通过退款
     */
    void approveRefund(Long id, String sellerNote, String sellerId);

    /**
     * 商家拒绝退款
     */
    void rejectRefund(Long id, String reason, String sellerId);

    /**
     * 用户取消退款申请
     */
    void cancelRefund(Long id, String userId);

    /**
     * 完成退款（模拟）
     */
    void completeRefund(Long id);
}
