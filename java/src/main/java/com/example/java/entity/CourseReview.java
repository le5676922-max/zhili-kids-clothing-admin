package com.example.java.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 课程评价实体
 */
@Data
public class CourseReview {
    private Integer id;
    private Integer courseId;
    private String userId;
    private Integer rating;
    private String content;
    private String replyContent;
    private LocalDateTime replyTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 扩展字段
    private String userNickname;
    private String userAvatar;
    private String courseName;
}
