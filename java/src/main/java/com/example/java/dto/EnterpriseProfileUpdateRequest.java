package com.example.java.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 企业用户资料更新请求（审核通过后在个人中心填写）
 */
@Data
public class EnterpriseProfileUpdateRequest {

    /** 企业地址（必填） */
    @NotBlank(message = "企业地址不能为空")
    private String enterpriseAddress;

    /** 企业电话（必填） */
    @NotBlank(message = "企业电话不能为空")
    private String enterprisePhone;

    /** 企业联系邮箱（必填） */
    @NotBlank(message = "企业联系邮箱不能为空")
    private String enterpriseContactEmail;

    /** 企业网站（选填） */
    private String enterpriseWebsite;

    /** 企业介绍 */
    private String enterpriseIntroduction;

    /** 自定义标签，逗号分隔，如：生产企业,大型企业,ISO9001 */
    private String enterpriseTags;

    /** 企业认证，逗号分隔 */
    private String enterpriseCertifications;

    /** 营业执照号码（变更时需重新审核） */
    private String enterpriseLicense;
}
