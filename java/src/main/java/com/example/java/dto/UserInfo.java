package com.example.java.dto;

import lombok.Data;

/**
 * 用户信息DTO
 */
@Data
public class UserInfo {

    /**
     * 用户ID
     */
    private String id;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像URL
     */
    private String avatar;

    /**
     * 用户类型: 1-个人用户 2-企业用户 3-管理员
     */
    private Integer userType;

    /**
     * 是否管理员，通过数据库 is_admin 字段判断
     */
    private Boolean isAdmin;

    /** 企业审核状态（仅企业用户）: 0=待审核 1=已通过 2=已拒绝 */
    private Integer enterpriseStatus;
    /** 企业名称 */
    private String enterpriseName;
    /** 企业地址 */
    private String enterpriseAddress;
    /** 企业电话 */
    private String enterprisePhone;
    /** 企业联系邮箱 */
    private String enterpriseContactEmail;
    /** 企业网站 */
    private String enterpriseWebsite;
    /** 企业介绍 */
    private String enterpriseIntroduction;
    /** 自定义标签，逗号分隔 */
    private String enterpriseTags;
    /** 企业认证，逗号分隔 */
    private String enterpriseCertifications;

    public UserInfo(String id, String email, String nickname, String avatar, Integer userType) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.avatar = avatar;
        this.userType = userType;
    }
}
