package com.example.java.dto.admin;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminCourseOrderRowDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer id;
    private String userId;
    private String buyerName;
    private String buyerEmail;
    private Integer courseId;
    private String courseName;
    private BigDecimal price;
    private String status;
    private LocalDateTime createdAt;
}
