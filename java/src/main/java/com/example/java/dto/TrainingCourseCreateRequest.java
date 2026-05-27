package com.example.java.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TrainingCourseCreateRequest {
    @NotBlank(message = "课程名称不能为空")
    private String courseName;
    @NotBlank(message = "课程类别不能为空")
    private String courseCategory;
    @NotBlank(message = "难度级别不能为空")
    private String courseLevel;
    @NotBlank(message = "课程形式不能为空")
    private String courseType;
    @NotNull(message = "开课时间不能为空")
    @jakarta.validation.constraints.FutureOrPresent(message = "开课时间必须是今天或将来")
    private LocalDate startDate;
    @NotNull(message = "课程时长不能为空")
    @jakarta.validation.constraints.Positive(message = "课程时长必须大于0")
    private Integer duration;
    @NotBlank(message = "讲师不能为空")
    private String instructor;
    @NotNull(message = "现价不能为空")
    @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "现价必须大于0")
    private BigDecimal price;
    private BigDecimal originalPrice;
    @NotBlank(message = "课程描述不能为空")
    private String courseDescription;
    private String courseImage;
    private String tags;
}
