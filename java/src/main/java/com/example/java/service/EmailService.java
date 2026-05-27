package com.example.java.service;

import com.example.java.exception.BusinessException;

public interface EmailService {

    /**
     * 发送验证码到指定邮箱
     * @param email 目标邮箱
     * @return 发送的验证码（用于测试，生产环境不应返回）
     */
    String sendVerifyCode(String email) throws BusinessException;

    /**
     * 验证验证码是否正确
     * @param email 邮箱
     * @param code 验证码
     * @return 是否正确
     */
    boolean verifyCode(String email, String code);

    /**
     * 发送邮箱修改验证码到新邮箱
     * @param oldEmail 原邮箱
     * @param newEmail 新邮箱
     */
    void sendEmailChangeCode(String oldEmail, String newEmail) throws BusinessException;
}
