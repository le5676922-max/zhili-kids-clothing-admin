package com.example.java.entity;

import java.time.LocalDateTime;

/**
 * 用户实体，对应表 users
 */
public class User {
    private String id;
    private String email;
    private String password;
    private String nickname;
    private String avatar;
    private Integer userType;      // 1=个人 2=企业 3=管理员
    private Boolean isAdmin;
    private Integer enterpriseStatus; // 0=待审核 1=已通过 2=已拒绝
    private String enterpriseName;
    private String enterpriseLicense;
    private String licenseImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public Integer getUserType() { return userType; }
    public void setUserType(Integer userType) { this.userType = userType; }
    public Boolean getIsAdmin() { return isAdmin; }
    public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }
    public Integer getEnterpriseStatus() { return enterpriseStatus; }
    public void setEnterpriseStatus(Integer enterpriseStatus) { this.enterpriseStatus = enterpriseStatus; }
    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }
    public String getEnterpriseLicense() { return enterpriseLicense; }
    public void setEnterpriseLicense(String enterpriseLicense) { this.enterpriseLicense = enterpriseLicense; }
    public String getLicenseImageUrl() { return licenseImageUrl; }
    public void setLicenseImageUrl(String licenseImageUrl) { this.licenseImageUrl = licenseImageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
