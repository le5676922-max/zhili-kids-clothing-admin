package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 培训课程实体，对应表 training_courses
 */
@Data
public class TrainingCourse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String courseName;
    private String courseCategory;
    private String courseLevel;
    private String courseType;
    private LocalDate startDate;
    private Integer duration;
    private String instructor;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String courseDescription;
    private String courseImage;
    private String tags;
    private Integer enrollCount;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
