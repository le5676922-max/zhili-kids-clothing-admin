package com.example.java.mapper;

import com.example.java.dto.RefundVO;
import com.example.java.entity.Refund;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 退款Mapper
 */
@Mapper
public interface RefundMapper {

    /**
     * 新增退款申请
     */
    int insert(Refund refund);

    /**
     * 根据ID查询退款
     */
    RefundVO selectById(@Param("id") Long id);

    /**
     * 根据退款单号查询退款
     */
    RefundVO selectByRefundNo(@Param("refundNo") String refundNo);

    /**
     * 根据用户ID查询退款列表（买家视角）
     */
    List<RefundVO> selectByUserId(@Param("userId") String userId);

    /**
     * 根据卖家ID查询退款列表（商家视角）
     */
    List<RefundVO> selectBySellerId(@Param("sellerId") String sellerId);

    /**
     * 根据订单ID查询退款列表
     */
    List<RefundVO> selectByOrderId(@Param("orderId") String orderId);

    /**
     * 检查订单是否有待处理的退款
     */
    int countPendingByOrderId(@Param("orderId") String orderId);

    /**
     * 更新退款状态
     */
    int updateStatus(@Param("id") Long id, @Param("status") String status, @Param("sellerNote") String sellerNote);

    /**
     * 更新退款状态和金额
     */
    int updateStatusAndAmount(@Param("id") Long id, @Param("status") String status, @Param("refundAmount") java.math.BigDecimal refundAmount, @Param("sellerNote") String sellerNote);
}
