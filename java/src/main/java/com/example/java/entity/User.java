package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户实体类，对应表 users
 */
@Data
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private String id;
    /** 邮箱（登录账号） */
    private String email;
    /** 密码 */
    private String password;
    /** 昵称 */
    private String nickname;
    /** 头像URL */
    private String avatar;
    /** 用户类型: 1=个人 2=企业 3=管理员 */
    private Integer userType;
    /** 是否管理员 */
    private Boolean isAdmin;
    /** 企业审核状态: 0=待审核 1=已通过 2=已拒绝 */
    private Integer enterpriseStatus;
    /** 企业名称 */
    private String enterpriseName;
    /** 营业执照号码 */
    private String enterpriseLicense;
    /** 营业执照图片URL */
    private String licenseImageUrl;
    /** 企业地址（审核通过后必填） */
    private String enterpriseAddress;
    /** 企业电话（必填） */
    private String enterprisePhone;
    /** 企业联系邮箱（必填） */
    private String enterpriseContactEmail;
    /** 企业网站（选填） */
    private String enterpriseWebsite;
    /** 企业介绍 */
    private String enterpriseIntroduction;
    /** 自定义标签，逗号分隔 */
    private String enterpriseTags;
    /** 企业认证，逗号分隔 */
    private String enterpriseCertifications;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    /**
     * 是否具备管理端权限：is_admin 为 true，或 user_type 为 3（管理员类型）。
     * 与库中仅写 user_type、未同步 is_admin 的旧数据兼容，避免 WebSocket 与 HTTP 行为不一致。
     */
    public boolean hasAdminRole() {
        if (Boolean.TRUE.equals(isAdmin)) {
            return true;
        }
        return userType != null && userType == 3;
    }
}
