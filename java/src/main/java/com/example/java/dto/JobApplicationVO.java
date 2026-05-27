package com.example.java.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 企业端「收到的简历」列表项
 */
@Data
public class JobApplicationVO {

    private Integer id;
    private Integer jobId;
    private String jobName;
    private String applicantId;
    private String applicantNickname;
    private String applicantEmail;
    private String resumeUrl;
    private Integer status;
    private LocalDateTime createdAt;
}
