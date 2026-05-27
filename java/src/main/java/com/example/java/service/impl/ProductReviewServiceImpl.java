package com.example.java.service.impl;

import com.example.java.entity.ProductReview;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.ProductMapper;
import com.example.java.mapper.ProductReviewMapper;
import com.example.java.service.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductReviewServiceImpl implements ProductReviewService {

    private final ProductReviewMapper reviewMapper;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public ProductReview createReview(String orderId, Integer orderItemId, String productId, String userId, Integer rating, String content, String images) {
        if (productId == null || productId.trim().isEmpty()) {
            throw new BusinessException("商品ID不能为空");
        }

        var product = productMapper.selectById(productId);
        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new BusinessException("评分必须在1-5之间");
        }

        if (content == null || content.trim().isEmpty()) {
            throw new BusinessException("评价内容不能为空");
        }

        if (orderItemId != null && reviewMapper.countByOrderItemId(orderItemId) > 0) {
            throw new BusinessException("该商品已评价");
        }

        if (orderItemId == null && reviewMapper.countByProductIdAndUserId(productId, userId) > 0) {
            throw new BusinessException("您已经评价过该商品");
        }

        ProductReview review = new ProductReview();
        review.setOrderId(orderId);
        review.setOrderItemId(orderItemId);
        review.setProductId(productId);
        review.setUserId(userId);
        review.setRating(rating);
        review.setContent(content.trim());
        review.setImages(images);
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());

        reviewMapper.insert(review);

        return reviewMapper.findById(review.getId());
    }

    @Override
    public List<ProductReview> getReviewsByProductId(String productId) {
        return reviewMapper.findByProductId(productId);
    }

    @Override
    public List<ProductReview> getReviewsByProductIdPage(String productId, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;
        int offset = (page - 1) * pageSize;
        return reviewMapper.findByProductIdPage(productId, offset, pageSize);
    }

    @Override
    public List<ProductReview> getReviewsByProductIdAndRating(String productId, Integer rating, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;
        int offset = (page - 1) * pageSize;
        return reviewMapper.findByProductIdAndRating(productId, rating, offset, pageSize);
    }

    @Override
    public List<ProductReview> getReviewsByUserId(String userId) {
        return reviewMapper.findByUserId(userId);
    }

    @Override
    public boolean hasReviewedByOrderItem(Integer orderItemId, String userId) {
        if (orderItemId == null) return false;
        return reviewMapper.countByOrderItemIdAndUserId(orderItemId, userId) > 0;
    }

    @Override
    public boolean hasReviewedByProduct(String productId, String userId) {
        return reviewMapper.countByProductIdAndUserId(productId, userId) > 0;
    }

    @Override
    public double getAverageRating(String productId) {
        return reviewMapper.getAverageRating(productId);
    }

    @Override
    public int getReviewCount(String productId) {
        return reviewMapper.countByProductId(productId);
    }

    @Override
    @Transactional
    public void replyReview(Integer reviewId, String replyContent) {
        ProductReview review = reviewMapper.findById(reviewId);
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
        ProductReview review = reviewMapper.findById(reviewId);
        if (review == null) {
            throw new BusinessException("评价不存在");
        }
        if (!userId.equals(review.getUserId())) {
            throw new BusinessException("无权删除该评价");
        }
        reviewMapper.deleteById(reviewId);
    }

    @Override
    public ProductReview getReviewById(Integer reviewId) {
        return reviewMapper.findById(reviewId);
    }

    @Override
    public ProductReview getReviewByOrderItem(Integer orderItemId, String userId) {
        if (orderItemId == null) return null;
        return reviewMapper.findByOrderItemIdAndUserId(orderItemId, userId);
    }
}
