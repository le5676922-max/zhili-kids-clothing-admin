package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.CourseReview;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.CourseReviewService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * 课程评价接口
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourseReviewController {

    private final CourseReviewService reviewService;
    private final UserService userService;

    /**
     * 获取当前用户ID
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BusinessException(401, "请先登录");
        }
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        return user.getId();
    }

    /**
     * 创建评价
     * POST /api/courses/{courseId}/reviews
     */
    @PostMapping("/courses/{courseId}/reviews")
    public R<CourseReview> createReview(
            @PathVariable Integer courseId,
            @RequestParam Integer rating,
            @RequestParam String content) {
        String userId = getCurrentUserId();
        CourseReview review = reviewService.createReview(courseId, userId, rating, content);
        return R.success(review);
    }

    /**
     * 获取课程的评价列表
     * GET /api/courses/{courseId}/reviews
     */
    @GetMapping("/courses/{courseId}/reviews")
    public R<List<CourseReview>> getReviews(@PathVariable Integer courseId) {
        List<CourseReview> reviews = reviewService.getReviewsByCourseId(courseId);
        // 清除敏感信息
        reviews.forEach(r -> {
            if (r.getUserId() != null) {
                // 只保留用于展示的信息
            }
        });
        return R.success(reviews);
    }

    /**
     * 分页获取课程的评价列表
     * GET /api/courses/{courseId}/reviews/page
     */
    @GetMapping("/courses/{courseId}/reviews/page")
    public R<Map<String, Object>> getReviewsPage(
            @PathVariable Integer courseId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        List<CourseReview> reviews = reviewService.getReviewsByCourseIdPage(courseId, page, pageSize);
        int total = reviewService.getReviewCount(courseId);
        double avgRating = reviewService.getAverageRating(courseId);

        Map<String, Object> result = new HashMap<>();
        result.put("list", reviews);
        result.put("total", total);
        result.put("avgRating", avgRating);
        result.put("page", page);
        result.put("pageSize", pageSize);

        return R.success(result);
    }

    /**
     * 获取课程评价统计信息
     * GET /api/courses/{courseId}/reviews/stats
     */
    @GetMapping("/courses/{courseId}/reviews/stats")
    public R<Map<String, Object>> getReviewStats(@PathVariable Integer courseId) {
        int count = reviewService.getReviewCount(courseId);
        double avgRating = reviewService.getAverageRating(courseId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("count", count);
        stats.put("avgRating", Math.round(avgRating * 10) / 10.0); // 保留一位小数

        return R.success(stats);
    }

    /**
     * 检查当前用户是否已评价该课程
     * GET /api/courses/{courseId}/reviews/check
     */
    @GetMapping("/courses/{courseId}/reviews/check")
    public R<Boolean> checkReviewed(@PathVariable Integer courseId) {
        String userId = getCurrentUserId();
        boolean hasReviewed = reviewService.hasReviewed(courseId, userId);
        return R.success(hasReviewed);
    }

    /**
     * 获取我的评价列表
     * GET /api/courses/reviews/my
     */
    @GetMapping("/courses/reviews/my")
    public R<List<CourseReview>> getMyReviews() {
        String userId = getCurrentUserId();
        List<CourseReview> reviews = reviewService.getReviewsByUserId(userId);
        return R.success(reviews);
    }

    /**
     * 删除我的评价
     * DELETE /api/courses/reviews/{reviewId}
     */
    @DeleteMapping("/courses/reviews/{reviewId}")
    public R<Void> deleteReview(@PathVariable Integer reviewId) {
        String userId = getCurrentUserId();
        reviewService.deleteReview(reviewId, userId);
        return R.successMsg("删除成功");
    }

    /**
     * 回复评价（仅管理员可操作）
     * PUT /api/courses/reviews/{reviewId}/reply
     */
    @PutMapping("/courses/reviews/{reviewId}/reply")
    public R<Void> replyReview(
            @PathVariable Integer reviewId,
            @RequestParam String content) {
        String userId = getCurrentUserId();
        CourseReview review = reviewService.getReviewById(reviewId);
        if (review == null) {
            return R.fail("评价不存在");
        }
        User currentUser = userService.getUserById(userId);
        if (currentUser == null || !currentUser.hasAdminRole()) {
            return R.error(403, "仅管理员可回复评价");
        }
        reviewService.replyReview(reviewId, content);
        return R.successMsg("回复成功");
    }
}
