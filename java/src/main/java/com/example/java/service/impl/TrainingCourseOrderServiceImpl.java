package com.example.java.service.impl;

import com.example.java.entity.TrainingCourse;
import com.example.java.entity.TrainingCourseOrder;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.TrainingCourseMapper;
import com.example.java.mapper.TrainingCourseOrderMapper;
import com.example.java.service.TrainingCourseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingCourseOrderServiceImpl implements TrainingCourseOrderService {

    private final TrainingCourseOrderMapper orderMapper;
    private final TrainingCourseMapper courseMapper;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public TrainingCourseOrder create(String userId, Integer courseId) {
        // 检查课程是否存在且上架
        TrainingCourse course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new BusinessException("课程不存在");
        }
        if (course.getStatus() == null || course.getStatus() != 1) {
            throw new BusinessException("课程已下架，无法购买");
        }

        // ========== 检查是否重复购买 ==========
        TrainingCourseOrder existing = orderMapper.selectByUserIdAndCourseId(userId, courseId);
        if (existing != null) {
            throw new BusinessException("您已购买过该课程，无需重复购买");
        }

        // 创建订单
        TrainingCourseOrder order = new TrainingCourseOrder();
        order.setUserId(userId);
        order.setCourseId(courseId);
        order.setCourseName(course.getCourseName());
        order.setPrice(course.getPrice());
        order.setStatus("pending"); // 待支付（后续接入真实支付流程后状态变更为 paid）
        orderMapper.insert(order);

        // 更新课程报名人数
        courseMapper.incrementEnrollCount(courseId);

        return order;
    }

    @Override
    public List<TrainingCourseOrder> listByUserId(String userId) {
        return orderMapper.selectByUserId(userId);
    }
}
