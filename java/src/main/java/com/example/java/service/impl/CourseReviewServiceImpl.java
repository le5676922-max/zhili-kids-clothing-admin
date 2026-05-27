package com.example.java.service.impl;

import com.example.java.entity.CourseReview;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.CourseReviewMapper;
import com.example.java.mapper.TrainingCourseMapper;
import com.example.java.service.CourseReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseReviewServiceImpl implements CourseReviewService {

    private final CourseReviewMapper reviewMapper;
    private final TrainingCourseMapper courseMapper;

    @Override
    @Transactional
    public CourseReview createReview(Integer courseId, String userId, Integer rating, String content) {
        // 检查课程是否存在
        var course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new BusinessException("课程不存在");
        }

        // 检查评分范围
        if (rating == null || rating < 1 || rating > 5) {
            throw new BusinessException("评分必须在1-5之间");
        }

        // 检查是否已评价
        if (reviewMapper.countByCourseIdAndUserId(courseId, userId) > 0) {
            throw new BusinessException("您已经评价过该课程");
        }

        // 检查是否已购买/报名该课程（可选，这里跳过以允许试评价）

        CourseReview review = new CourseReview();
        review.setCourseId(courseId);
        review.setUserId(userId);
        review.setRating(rating);
        review.setContent(content);
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());

        reviewMapper.insert(review);

        return reviewMapper.findById(review.getId());
    }

    @Override
    public List<CourseReview> getReviewsByCourseId(Integer courseId) {
        return reviewMapper.findByCourseId(courseId);
    }

    @Override
    public List<CourseReview> getReviewsByCourseIdPage(Integer courseId, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;
        int offset = (page - 1) * pageSize;
        return reviewMapper.findByCourseIdPage(courseId, offset, pageSize);
    }

    @Override
    public List<CourseReview> getReviewsByUserId(String userId) {
        return reviewMapper.findByUserId(userId);
    }

    @Override
    public boolean hasReviewed(Integer courseId, String userId) {
        return reviewMapper.countByCourseIdAndUserId(courseId, userId) > 0;
    }

    @Override
    public double getAverageRating(Integer courseId) {
        return reviewMapper.getAverageRating(courseId);
    }

    @Override
    public int getReviewCount(Integer courseId) {
        return reviewMapper.countByCourseId(courseId);
    }

    @Override
    @Transactional
    public void replyReview(Integer reviewId, String replyContent) {
        CourseReview review = reviewMapper.findById(reviewId);
        if (review == null) {
            throw new BusinessException("评价不存在");
        }
        if (replyContent == null || replyContent.trim().isEmpty()) {
            throw new BusinessException("回复内容不能为空");
        }
        reviewMapper.updateReply(reviewId, replyContent.trim());
    }

    @Override
    @Transactional
    public void deleteReview(Integer reviewId, String userId) {
        CourseReview review = reviewMapper.findById(reviewId);
        if (review == null) {
            throw new BusinessException("评价不存在");
        }
        if (!userId.equals(review.getUserId())) {
            throw new BusinessException("无权删除该评价");
        }
        reviewMapper.deleteById(reviewId);
    }

    @Override
    public CourseReview getReviewById(Integer reviewId) {
        return reviewMapper.findById(reviewId);
    }
}
