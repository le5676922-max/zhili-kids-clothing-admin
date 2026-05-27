package com.example.java.service;

import com.example.java.entity.ProductReview;

import java.util.List;

/**
 * 商品评价服务接口
 */
public interface ProductReviewService {

    /**
     * 创建评价
     * @param orderId 订单ID
     * @param orderItemId 订单项ID
     * @param productId 商品ID
     * @param userId 用户ID
     * @param rating 评分（1-5）
     * @param content 评价内容
     * @param images 图片URLs（JSON数组）
     * @return 创建的评价
     */
    ProductReview createReview(String orderId, Integer orderItemId, String productId, String userId, Integer rating, String content, String images);

    /**
     * 获取商品的评价列表
     * @param productId 商品ID
     * @return 评价列表
     */
    List<ProductReview> getReviewsByProductId(String productId);

    /**
     * 分页获取商品的评价列表
     * @param productId 商品ID
     * @param page 页码
     * @param pageSize 每页数量
     * @return 评价列表
     */
    List<ProductReview> getReviewsByProductIdPage(String productId, int page, int pageSize);

    /**
     * 按评分筛选获取商品的评价列表
     * @param productId 商品ID
     * @param rating 评分
     * @param page 页码
     * @param pageSize 每页数量
     * @return 评价列表
     */
    List<ProductReview> getReviewsByProductIdAndRating(String productId, Integer rating, int page, int pageSize);

    /**
     * 获取用户的评价列表
     * @param userId 用户ID
     * @return 评价列表
     */
    List<ProductReview> getReviewsByUserId(String userId);

    /**
     * 检查用户是否已评价过该商品（基于订单项）
     * @param orderItemId 订单项ID
     * @param userId 用户ID
     * @return true=已评价
     */
    boolean hasReviewedByOrderItem(Integer orderItemId, String userId);

    /**
     * 检查用户是否已评价过该商品（基于商品ID）
     * @param productId 商品ID
     * @param userId 用户ID
     * @return true=已评价
     */
    boolean hasReviewedByProduct(String productId, String userId);

    /**
     * 获取商品的平均评分
     * @param productId 商品ID
     * @return 平均评分
     */
    double getAverageRating(String productId);

    /**
     * 获取商品的评价数量
     * @param productId 商品ID
     * @return 评价数量
     */
    int getReviewCount(String productId);

    /**
     * 回复评价（商家）
     * @param reviewId 评价ID
     * @param replyContent 回复内容
     */
    void replyReview(Integer reviewId, String replyContent);

    /**
     * 删除评价
     * @param reviewId 评价ID
     * @param userId 用户ID
     */
    void deleteReview(Integer reviewId, String userId);

    /**
     * 获取评价详情
     * @param reviewId 评价ID
     * @return 评价详情
     */
    ProductReview getReviewById(Integer reviewId);

    /**
     * 获取订单项的评价状态
     * @param orderItemId 订单项ID
     * @param userId 用户ID
     * @return 评价信息（如果有）
     */
    ProductReview getReviewByOrderItem(Integer orderItemId, String userId);
}
