package com.example.java.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 管理员重置用户密码请求
 */
@Data
public class AdminResetPasswordRequest {
    
    @NotBlank(message = "新密码不能为空")
    private String newPassword;
}
