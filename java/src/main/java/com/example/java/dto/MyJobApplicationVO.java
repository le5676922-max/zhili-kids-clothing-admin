package com.example.java.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 个人用户「已投简历」列表项
 */
@Data
public class MyJobApplicationVO {

    private Integer id;
    private Integer jobId;
    private String jobName;
    /** 发布职位的企业名称 */
    private String companyName;
    private String resumeUrl;
    /** 0-待查看 1-已查看 2-已通过 3-已拒绝 */
    private Integer status;
    private LocalDateTime createdAt;
}
