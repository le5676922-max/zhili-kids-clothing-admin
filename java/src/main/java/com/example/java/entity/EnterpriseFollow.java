package com.example.java.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 企业关注实体
 */
@Data
public class EnterpriseFollow {
    private Integer id;
    private String userId;
    private String enterpriseId;
    private LocalDateTime createdAt;
}
