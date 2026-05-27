package com.example.java.mapper;

import com.example.java.dto.OrderVO;
import com.example.java.dto.admin.AdminOrderRowDTO;
import com.example.java.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderMapper {
    void insert(Order order);
    void updateStatus(@Param("id") String id, @Param("status") String status);
    /** 带乐观锁的状态更新，仅当订单处于预期状态时才更新 */
    int updateStatusWithLock(@Param("id") String id, @Param("status") String status, @Param("expectedStatus") String expectedStatus);
    OrderVO selectById(@Param("id") String id);
    /** 通过运单号查询订单 */
    OrderVO selectByTrackingNo(@Param("trackingNo") String trackingNo);
    List<OrderVO> selectByUserId(@Param("userId") String userId);
    List<OrderVO> selectSalesBySellerId(@Param("sellerId") String sellerId);
    void updateShip(@Param("orderId") String orderId, @Param("trackingNo") String trackingNo);

    /** 管理端：全部订单项（买家、卖家、商品）分页 */
    List<AdminOrderRowDTO> selectAllForAdmin(@Param("offset") int offset, @Param("limit") int limit);
    int countForAdmin();

    /** 查询超时未支付的订单 */
    List<Order> findExpiredPendingOrders(@Param("minutes") int minutes);

    /** 查询发货超过指定天数未确认收货的订单 */
    List<Order> findDeliveredOrdersForAutoConfirm(@Param("days") int days);

    /** 获取订单的卖家ID（从订单项中的商品获取） */
    String getSellerIdByOrderId(@Param("orderId") String orderId);
}
