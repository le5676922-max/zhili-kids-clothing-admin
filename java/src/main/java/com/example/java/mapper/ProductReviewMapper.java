package com.example.java.mapper;

import com.example.java.entity.ProductReview;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ProductReviewMapper {

    @Insert("INSERT INTO product_reviews (order_id, order_item_id, product_id, user_id, rating, content, images, created_at, updated_at) " +
            "VALUES (#{orderId}, #{orderItemId}, #{productId}, #{userId}, #{rating}, #{content}, #{images}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ProductReview review);

    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar, " +
            "p.name AS product_name, p.image_url AS product_image, p.price AS product_price " +
            "FROM product_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "LEFT JOIN products p ON r.product_id = p.id " +
            "WHERE r.product_id = #{productId} " +
            "ORDER BY r.created_at DESC")
    List<ProductReview> findByProductId(@Param("productId") String productId);

    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar " +
            "FROM product_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "WHERE r.user_id = #{userId} " +
            "ORDER BY r.created_at DESC")
    List<ProductReview> findByUserId(@Param("userId") String userId);

    @Select("SELECT COUNT(*) FROM product_reviews WHERE product_id = #{productId} AND user_id = #{userId}")
    int countByProductIdAndUserId(@Param("productId") String productId, @Param("userId") String userId);

    @Select("SELECT COUNT(*) FROM product_reviews WHERE order_item_id = #{orderItemId}")
    int countByOrderItemId(@Param("orderItemId") Integer orderItemId);

    @Select("SELECT COUNT(*) FROM product_reviews WHERE order_item_id = #{orderItemId} AND user_id = #{userId}")
    int countByOrderItemIdAndUserId(@Param("orderItemId") Integer orderItemId, @Param("userId") String userId);

    @Select("SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = #{productId}")
    double getAverageRating(@Param("productId") String productId);

    @Select("SELECT COUNT(*) FROM product_reviews WHERE product_id = #{productId}")
    int countByProductId(@Param("productId") String productId);

    @Update("UPDATE product_reviews SET reply_content = #{replyContent}, reply_time = NOW(), updated_at = NOW() WHERE id = #{id}")
    int updateReply(@Param("id") Integer id, @Param("replyContent") String replyContent);

    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar, " +
            "p.name AS product_name, p.image_url AS product_image " +
            "FROM product_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "LEFT JOIN products p ON r.product_id = p.id " +
            "WHERE r.id = #{id}")
    ProductReview findById(@Param("id") Integer id);

    @Delete("DELETE FROM product_reviews WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar " +
            "FROM product_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "WHERE r.order_item_id = #{orderItemId} AND r.user_id = #{userId} " +
            "LIMIT 1")
    ProductReview findByOrderItemIdAndUserId(@Param("orderItemId") Integer orderItemId, @Param("userId") String userId);

    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar, " +
            "p.name AS product_name, p.image_url AS product_image, p.price AS product_price " +
            "FROM product_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "LEFT JOIN products p ON r.product_id = p.id " +
            "WHERE r.product_id = #{productId} " +
            "ORDER BY r.created_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<ProductReview> findByProductIdPage(@Param("productId") String productId,
                                              @Param("offset") int offset,
                                              @Param("limit") int limit);

    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar, " +
            "p.name AS product_name, p.image_url AS product_image, p.price AS product_price " +
            "FROM product_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "LEFT JOIN products p ON r.product_id = p.id " +
            "WHERE r.product_id = #{productId} AND r.rating = #{rating} " +
            "ORDER BY r.created_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<ProductReview> findByProductIdAndRating(@Param("productId") String productId,
                                                   @Param("rating") Integer rating,
                                                   @Param("offset") int offset,
                                                   @Param("limit") int limit);
}
