package com.example.java.service.impl;

import com.example.java.dto.ChangePasswordRequest;
import com.example.java.dto.LoginRequest;
import com.example.java.dto.LoginResponse;
import com.example.java.dto.RegisterRequest;
import com.example.java.dto.ResetPasswordRequest;
import com.example.java.dto.UserInfo;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.UserMapper;
import com.example.java.security.JwtUtils;
import com.example.java.service.EmailService;
import com.example.java.service.RedisTokenService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 用户Service实现类
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final RedisTokenService redisTokenService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 判断用户是否为管理员（is_admin 或 user_type=3）
     */
    private static boolean isAdminUser(User user) {
        return user != null && user.hasAdminRole();
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // 根据邮箱查询用户
        User user = userMapper.findByEmail(request.getEmail());

        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isEmpty()) {
            throw new BusinessException("密码错误");
        }

        // 使用 BCrypt 验证密码（支持明文旧密码兼容）
        boolean passwordOk = passwordEncoder.matches(request.getPassword(), storedPassword)
                || request.getPassword().equals(storedPassword);
        if (!passwordOk) {
            throw new BusinessException("密码错误");
        }

        // 如果密码是明文（旧数据），自动升级为 BCrypt 哈希
        if (request.getPassword().equals(storedPassword) && !storedPassword.startsWith("$2")) {
            String encoded = passwordEncoder.encode(storedPassword);
            user.setPassword(encoded);
            userMapper.update(user);
        }

        // 生成JWT令牌
        String token = jwtUtils.generateToken(user.getId(), user.getNickname(), user.getEmail());

        // 登录前清除该用户的所有旧 Token，防止同一账号多处登录
        redisTokenService.removeTokensByUserId(user.getId());
        // 存入新 Token
        redisTokenService.saveToken(token, user.getId(), jwtUtils.getExpirationMillis());

        // 构建响应
        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getAvatar(),
                user.getUserType()
        );
        userInfo.setIsAdmin(isAdminUser(user));
        fillEnterpriseUserInfo(userInfo, user);

        return new LoginResponse(token, jwtUtils.getExpiration(), userInfo);
    }

    /**
     * 退出登录：清除 Redis 中的 Token，使其立即失效
     *
     * @param token 当前用户的 JWT Token
     */
    @Override
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            redisTokenService.removeToken(token);
        }
    }

    private void fillEnterpriseUserInfo(com.example.java.dto.UserInfo userInfo, User user) {
        if (user.getUserType() == null || user.getUserType() != 2) return;
        userInfo.setEnterpriseStatus(user.getEnterpriseStatus());
        userInfo.setEnterpriseName(user.getEnterpriseName());
        userInfo.setEnterpriseAddress(user.getEnterpriseAddress());
        userInfo.setEnterprisePhone(user.getEnterprisePhone());
        userInfo.setEnterpriseContactEmail(user.getEnterpriseContactEmail());
        userInfo.setEnterpriseWebsite(user.getEnterpriseWebsite());
        userInfo.setEnterpriseIntroduction(user.getEnterpriseIntroduction());
        userInfo.setEnterpriseTags(user.getEnterpriseTags());
        userInfo.setEnterpriseCertifications(user.getEnterpriseCertifications());
    }

    @Override
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        // 校验验证码
        if (!emailService.verifyCode(request.getEmail(), request.getCode())) {
            throw new BusinessException("验证码错误或已过期");
        }

        // 检查邮箱是否已存在
        if (checkEmailExists(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }

        // 创建用户 - 密码使用 BCrypt 哈希存储
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt 哈希存储
        user.setNickname(request.getEmail());
        user.setUserType(request.getUserType() != null ? request.getUserType() : 1);
        user.setIsAdmin(false);

        if (user.getUserType() != null && user.getUserType() == 2) {
            user.setEnterpriseStatus(0); // 企业用户：待审核
            if (request.getEnterpriseName() != null && !request.getEnterpriseName().isBlank()) {
                user.setEnterpriseName(request.getEnterpriseName().trim());
            }
            if (request.getEnterpriseLicense() != null && !request.getEnterpriseLicense().isBlank()) {
                user.setEnterpriseLicense(request.getEnterpriseLicense().trim());
            }
            if (request.getLicenseImageUrl() != null && !request.getLicenseImageUrl().isBlank()) {
                user.setLicenseImageUrl(request.getLicenseImageUrl().trim());
            }
        } else {
            user.setEnterpriseStatus(null);
        }

        userMapper.insert(user);

        // 生成JWT令牌
        String token = jwtUtils.generateToken(user.getId(), user.getNickname(), user.getEmail());
        
        // 将 Token 存入 Redis（与登录保持一致）
        redisTokenService.saveToken(token, user.getId(), jwtUtils.getExpirationMillis());
        
        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getAvatar(),
                user.getUserType()
        );
        userInfo.setIsAdmin(isAdminUser(user));
        fillEnterpriseUserInfo(userInfo, user);

        return new LoginResponse(token, jwtUtils.getExpiration(), userInfo);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        if (!emailService.verifyCode(request.getEmail(), request.getCode())) {
            throw new BusinessException("验证码错误或已过期");
        }
        User user = userMapper.findByEmail(request.getEmail());
        if (user == null) {
            throw new BusinessException("该邮箱未注册");
        }
        // 使用 BCrypt 哈希存储新密码
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userMapper.update(user);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        // 原密码修改：通过邮箱查询用户，使用 BCrypt 验证原密码
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        // BCrypt 验证原密码（支持明文旧密码兼容）
        boolean oldOk = passwordEncoder.matches(request.getOldPassword(), user.getPassword())
                || request.getOldPassword().equals(user.getPassword());
        if (!oldOk) {
            throw new BusinessException("原密码错误");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BusinessException("新密码不能与原密码相同");
        }
        // 使用 BCrypt 哈希存储新密码
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userMapper.update(user);
        // 清除该用户所有旧 Token，强制重新登录
        redisTokenService.removeTokensByUserId(user.getId());
    }

    @Override
    public User getUserByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    @Override
    public User getUserByUsername(String username) {
        // 表 users 无 username 字段，按邮箱查询（登录账号为邮箱）
        return userMapper.findByEmail(username);
    }

    @Override
    public boolean checkEmailExists(String email) {
        return userMapper.countByEmail(email) > 0;
    }

    @Override
    public boolean checkUsernameExists(String username) {
        // 表 users 无 username，用邮箱数量代替
        return userMapper.countByEmail(username) > 0;
    }

    @Override
    public void updateUser(User user) {
        userMapper.update(user);
    }

    @Override
    public User getUserById(String id) {
        return userMapper.findById(id);
    }

    @Override
    @Transactional
    public void adminResetPassword(String userId, String newPassword) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        // 管理员不能修改自己的密码
        if (user.hasAdminRole()) {
            throw new BusinessException("不能修改管理员账号密码");
        }
        // 使用 BCrypt 哈希存储新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.update(user);
        // 清除被重置用户的所有 Token，强制重新登录
        redisTokenService.removeTokensByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        // 管理员不能注销自己
        if (user.hasAdminRole()) {
            throw new BusinessException("不能注销管理员账号");
        }
        userMapper.deleteById(userId);
        // 清除被注销用户的所有 Token
        redisTokenService.removeTokensByUserId(userId);
    }

    @Override
    @Transactional
    public void updateEnterpriseStatus(String userId, Integer status) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (user.getUserType() == null || user.getUserType() != 2) {
            throw new BusinessException("仅企业用户可更新审核状态");
        }
        user.setEnterpriseStatus(status);
        userMapper.update(user);
    }

    @Override
    public List<User> listEnterpriseUsers() {
        return userMapper.findEnterpriseList();
    }
}
