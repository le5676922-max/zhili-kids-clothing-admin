package com.example.java.service;

import com.example.java.entity.CourseReview;

import java.util.List;

/**
 * 课程评价服务接口
 */
public interface CourseReviewService {

    /**
     * 创建评价
     * @param courseId 课程ID
     * @param userId 用户ID
     * @param rating 评分（1-5）
     * @param content 评价内容
     * @return 创建的评价
     */
    CourseReview createReview(Integer courseId, String userId, Integer rating, String content);

    /**
     * 获取课程的评价列表
     * @param courseId 课程ID
     * @return 评价列表
     */
    List<CourseReview> getReviewsByCourseId(Integer courseId);

    /**
     * 分页获取课程的评价列表
     * @param courseId 课程ID
     * @param page 页码
     * @param pageSize 每页数量
     * @return 评价列表
     */
    List<CourseReview> getReviewsByCourseIdPage(Integer courseId, int page, int pageSize);

    /**
     * 获取用户的评价列表
     * @param userId 用户ID
     * @return 评价列表
     */
    List<CourseReview> getReviewsByUserId(String userId);

    /**
     * 检查用户是否已评价过该课程
     * @param courseId 课程ID
     * @param userId 用户ID
     * @return true=已评价
     */
    boolean hasReviewed(Integer courseId, String userId);

    /**
     * 获取课程的平均评分
     * @param courseId 课程ID
     * @return 平均评分
     */
    double getAverageRating(Integer courseId);

    /**
     * 获取课程的评价数量
     * @param courseId 课程ID
     * @return 评价数量
     */
    int getReviewCount(Integer courseId);

    /**
     * 回复评价
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
    CourseReview getReviewById(Integer reviewId);
}
