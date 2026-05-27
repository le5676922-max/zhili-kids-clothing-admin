package com.example.java.dto.admin;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 后台管理系统 - 用户列表项 VO（不包含密码）
 */
@Data
public class AdminUserVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String email;
    private String nickname;
    private String avatar;
    /** 用户类型: 1=个人 2=企业 3=管理员 */
    private Integer userType;
    /** 企业审核状态: 0=待审核 1=已通过 2=已拒绝 */
    private Integer enterpriseStatus;
    private String enterpriseName;
    private String enterpriseLicense;
    private String licenseImageUrl;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
