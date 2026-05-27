package com.example.java.service;

import com.example.java.entity.TrainingCourseOrder;

import java.util.List;

/**
 * 培训课程订单服务
 */
public interface TrainingCourseOrderService {
    /**
     * 创建课程订单
     */
    TrainingCourseOrder create(String userId, Integer courseId);
    
    /**
     * 获取用户的课程订单列表
     */
    List<TrainingCourseOrder> listByUserId(String userId);
}
