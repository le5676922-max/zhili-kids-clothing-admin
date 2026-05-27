package com.example.java.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 注册请求DTO
 */
@Data
public class RegisterRequest {

    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 20, message = "密码长度必须在8-20之间")
    private String password;

    /**
     * 确认密码
     */
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;

    /**
     * 验证码
     */
    @NotBlank(message = "验证码不能为空")
    @Size(min = 6, max = 6, message = "验证码长度必须为6位")
    private String code;

    /**
     * 用户类型: 1-个人用户 2-企业用户
     */
    private Integer userType;

    /** 企业名称（企业用户必填） */
    private String enterpriseName;
    /** 营业执照号码（企业用户必填） */
    private String enterpriseLicense;
    /** 营业执照图片 URL（企业用户可选，上传后填入） */
    private String licenseImageUrl;
}
