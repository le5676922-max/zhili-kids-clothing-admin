package com.example.java.mapper;

import com.example.java.entity.CourseReview;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface CourseReviewMapper {

    /**
     * 新增评价
     */
    @Insert("INSERT INTO course_reviews (course_id, user_id, rating, content, created_at, updated_at) " +
            "VALUES (#{courseId}, #{userId}, #{rating}, #{content}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(CourseReview review);

    /**
     * 根据课程ID查询评价列表
     */
    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar " +
            "FROM course_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "WHERE r.course_id = #{courseId} " +
            "ORDER BY r.created_at DESC")
    List<CourseReview> findByCourseId(@Param("courseId") Integer courseId);

    /**
     * 根据用户ID查询评价列表
     */
    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar " +
            "FROM course_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "WHERE r.user_id = #{userId} " +
            "ORDER BY r.created_at DESC")
    List<CourseReview> findByUserId(@Param("userId") String userId);

    /**
     * 检查用户是否已评价过该课程
     */
    @Select("SELECT COUNT(*) FROM course_reviews WHERE course_id = #{courseId} AND user_id = #{userId}")
    int countByCourseIdAndUserId(@Param("courseId") Integer courseId, @Param("userId") String userId);

    /**
     * 获取课程的平均评分
     */
    @Select("SELECT COALESCE(AVG(rating), 0) FROM course_reviews WHERE course_id = #{courseId}")
    double getAverageRating(@Param("courseId") Integer courseId);

    /**
     * 获取课程的评价数量
     */
    @Select("SELECT COUNT(*) FROM course_reviews WHERE course_id = #{courseId}")
    int countByCourseId(@Param("courseId") Integer courseId);

    /**
     * 回复评价
     */
    @Update("UPDATE course_reviews SET reply_content = #{replyContent}, reply_time = NOW(), updated_at = NOW() WHERE id = #{id}")
    int updateReply(@Param("id") Integer id, @Param("replyContent") String replyContent);

    /**
     * 根据ID查询评价
     */
    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar " +
            "FROM course_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "WHERE r.id = #{id}")
    CourseReview findById(@Param("id") Integer id);

    /**
     * 删除评价
     */
    @Delete("DELETE FROM course_reviews WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 分页查询课程评价
     */
    @Select("SELECT r.*, u.nickname AS user_nickname, u.avatar AS user_avatar " +
            "FROM course_reviews r " +
            "LEFT JOIN users u ON r.user_id = u.id " +
            "WHERE r.course_id = #{courseId} " +
            "ORDER BY r.created_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<CourseReview> findByCourseIdPage(@Param("courseId") Integer courseId,
                                          @Param("offset") int offset,
                                          @Param("limit") int limit);
}
