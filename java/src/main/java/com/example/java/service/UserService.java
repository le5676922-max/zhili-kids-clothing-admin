package com.example.java.service;

import com.example.java.dto.ChangePasswordRequest;
import com.example.java.dto.LoginRequest;
import com.example.java.dto.LoginResponse;
import com.example.java.dto.RegisterRequest;
import com.example.java.dto.ResetPasswordRequest;
import com.example.java.entity.User;

import java.util.List;

/**
 * 用户Service接口
 */
public interface UserService {

    /**
     * 用户登录
     */
    LoginResponse login(LoginRequest request);

    /**
     * 用户退出登录（Phase 3：清除 Redis 中的 Token 黑名单）
     *
     * @param token 当前用户的 JWT Token
     */
    void logout(String token);

    /**
     * 用户注册
     */
    LoginResponse register(RegisterRequest request);

    /**
     * 重置密码（通过邮箱验证码）
     */
    void resetPassword(ResetPasswordRequest request);

    /**
     * 修改密码（通过原密码，需已登录）：根据邮箱查询用户，将库中密码与请求中的原密码比对后更新。
     */
    void changePassword(String email, ChangePasswordRequest request);

    /**
     * 根据邮箱查询用户
     */
    User getUserByEmail(String email);

    /**
     * 根据用户名查询用户
     */
    User getUserByUsername(String username);

    /**
     * 检查邮箱是否已存在
     */
    boolean checkEmailExists(String email);

    /**
     * 检查用户名是否已存在
     */
    boolean checkUsernameExists(String username);

    /**
     * 更新用户信息
     */
    void updateUser(User user);

    /**
     * 根据用户ID查询用户
     */
    User getUserById(String id);

    /**
     * 管理员重置用户密码
     */
    void adminResetPassword(String userId, String newPassword);

    /**
     * 管理员注销用户账户（删除用户）
     */
    void deleteUser(String userId);

    /**
     * 管理员更新企业用户审核状态（0=待审核 1=已通过 2=已拒绝）
     */
    void updateEnterpriseStatus(String userId, Integer status);

    /**
     * 企业展示：查询已通过审核的企业用户列表（无需登录）
     */
    List<User> listEnterpriseUsers();
}
