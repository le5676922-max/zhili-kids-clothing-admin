package com.example.java.service;

import com.example.java.dto.OrderCreateRequest;
import com.example.java.dto.OrderVO;
import com.example.java.dto.admin.AdminOrderPageResult;
import java.util.List;

public interface OrderService {
    OrderVO create(String userId, OrderCreateRequest request);
    OrderVO getById(String orderId);
    /** 通过运单号查询订单（物流查询用） */
    OrderVO getByTrackingNo(String trackingNo);
    List<OrderVO> listByUserId(String userId);
    List<OrderVO> listSalesBySellerId(String sellerId);
    void updateStatus(String orderId, String status);
    void shipOrder(String orderId, String trackingNo, String sellerId);
    void clearCart(String userId, List<Integer> cartIds);
    /** 支付订单：扣减库存、累加销量、清空购物车 */
    OrderVO payOrder(String orderId, String userId);
    /** 取消订单：恢复库存 */
    void cancelOrder(String orderId, String userId);

    /** 取消超时订单（内部使用，不检查用户权限） */
    void cancelExpiredOrder(String orderId);

    /** 确认收货 */
    void confirmReceived(String orderId, String userId);

    /** 管理端：分页查询全部订单（按订单项展开，含买家、卖家、商品） */
    AdminOrderPageResult listOrdersForAdmin(int page, int pageSize);
}
