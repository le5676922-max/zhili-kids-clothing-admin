package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 招聘职位实体，对应表 job_positions
 */
@Data
public class JobPosition implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String userId;
    private String jobName;
    private Integer salaryMin;
    private Integer salaryMax;
    private String workLocation;
    private String experience;
    private String education;
    private Integer recruitCount;
    private String jobDescription;
    private String skills;
    private String jobCategory;
    private Integer status;
    private Integer viewCount;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 关联查询的企业信息
    private String companyName;
    private String companyLogo;
}
