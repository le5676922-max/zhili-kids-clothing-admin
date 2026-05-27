package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.ProductReview;
import com.example.java.entity.User;
import com.example.java.service.ProductReviewService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService reviewService;
    private final UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new com.example.java.exception.BusinessException("请先登录");
        }
        return user.getId();
    }

    /**
     * 创建商品评价
     */
    @PostMapping
    public R<ProductReview> create(@RequestBody Map<String, Object> body) {
        String userId = getCurrentUserId();

        String orderId = (String) body.get("orderId");
        Integer orderItemId = body.get("orderItemId") != null ? ((Number) body.get("orderItemId")).intValue() : null;
        String productId = (String) body.get("productId");
        Integer rating = body.get("rating") != null ? ((Number) body.get("rating")).intValue() : null;
        String content = (String) body.get("content");
        String images = body.get("images") != null ? body.get("images").toString() : null;

        ProductReview review = reviewService.createReview(orderId, orderItemId, productId, userId, rating, content, images);
        return R.success("评价成功", review);
    }

    /**
     * 获取商品的评价列表（公开接口）
     */
    @GetMapping("/product/{productId}")
    public R<Map<String, Object>> getByProductId(
            @PathVariable String productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer rating) {

        List<ProductReview> reviews;
        if (rating != null) {
            reviews = reviewService.getReviewsByProductIdAndRating(productId, rating, page, pageSize);
        } else {
            reviews = reviewService.getReviewsByProductIdPage(productId, page, pageSize);
        }

        double averageRating = reviewService.getAverageRating(productId);
        int reviewCount = reviewService.getReviewCount(productId);

        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews);
        result.put("averageRating", Math.round(averageRating * 10) / 10.0);
        result.put("reviewCount", reviewCount);

        return R.success(result);
    }

    /**
     * 获取当前用户的评价列表
     */
    @GetMapping("/my")
    public R<List<ProductReview>> getMyReviews() {
        String userId = getCurrentUserId();
        List<ProductReview> reviews = reviewService.getReviewsByUserId(userId);
        return R.success(reviews);
    }

    /**
     * 获取评价详情
     */
    @GetMapping("/{id}")
    public R<ProductReview> getById(@PathVariable Integer id) {
        ProductReview review = reviewService.getReviewById(id);
        if (review == null) {
            return R.error("评价不存在");
        }
        return R.success(review);
    }

    /**
     * 检查用户是否已评价某商品
     */
    @GetMapping("/check")
    public R<Map<String, Object>> checkReview(
            @RequestParam(required = false) Integer orderItemId,
            @RequestParam(required = false) String productId) {
        String userId = getCurrentUserId();

        boolean hasReviewed = false;
        if (orderItemId != null) {
            hasReviewed = reviewService.hasReviewedByOrderItem(orderItemId, userId);
        } else if (productId != null) {
            hasReviewed = reviewService.hasReviewedByProduct(productId, userId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hasReviewed", hasReviewed);
        return R.success(result);
    }

    /**
     * 回复评价（商家/管理员）
     */
    @PostMapping("/{id}/reply")
    public R<ProductReview> reply(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String replyContent = body.get("replyContent");
        reviewService.replyReview(id, replyContent);
        return R.success("回复成功", reviewService.getReviewById(id));
    }

    /**
     * 删除评价（用户只能删除自己的评价）
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Integer id) {
        String userId = getCurrentUserId();
        reviewService.deleteReview(id, userId);
        return R.success("删除成功", null);
    }
}
