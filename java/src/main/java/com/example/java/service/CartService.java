package com.example.java.service;

import com.example.java.dto.CartAddRequest;
import com.example.java.dto.CartItemVO;

import java.util.List;

/**
 * 购物车服务
 */
public interface CartService {

    /**
     * 加入购物车（同款同规格则增加数量）
     */
    void add(String userId, CartAddRequest request);

    /**
     * 当前用户购物车列表
     */
    List<CartItemVO> list(String userId);

    /**
     * 当前用户购物车商品总件数
     */
    int count(String userId);

    /**
     * 修改数量
     */
    void updateQuantity(String userId, Integer cartId, Integer quantity);

    /**
     * 删除购物车项
     */
    void delete(String userId, Integer cartId);

    /**
     * 批量删除购物车项（清空购物车）
     */
    void clearCart(String userId, List<Integer> cartIds);

    /**
     * 根据用户ID和产品ID查找购物车项ID列表（用于支付后清空购物车）
     */
    List<Integer> findCartIdsByUserIdAndProductId(String userId, String productId);
}
