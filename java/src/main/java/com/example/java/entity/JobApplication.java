package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 职位申请实体，对应表 job_applications
 */
@Data
public class JobApplication implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String userId;
    private Integer jobId;
    private String resumeUrl;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
