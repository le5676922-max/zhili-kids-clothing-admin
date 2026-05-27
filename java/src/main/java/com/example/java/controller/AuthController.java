package com.example.java.controller;

import com.example.java.common.R;
import jakarta.servlet.http.HttpServletRequest;
import com.example.java.dto.AdminResetPasswordRequest;
import com.example.java.dto.ChangeEmailRequest;
import com.example.java.dto.ChangePasswordRequest;
import com.example.java.dto.LoginRequest;
import com.example.java.dto.LoginResponse;
import com.example.java.dto.EnterpriseProfileUpdateRequest;
import com.example.java.dto.ProfileUpdateRequest;
import com.example.java.dto.RegisterRequest;
import com.example.java.dto.ResetPasswordRequest;
import com.example.java.dto.SendCodeRequest;
import com.example.java.dto.SendEmailChangeCodeRequest;
import com.example.java.dto.UserInfo;
import com.example.java.dto.VerifyCodeRequest;
import com.example.java.dto.WorkOrderChatMessage;
import com.example.java.dto.WorkOrderCreateRequest;
import com.example.java.dto.WorkOrderReplyRequest;
import com.example.java.entity.User;
import com.example.java.entity.WorkOrder;
import com.example.java.service.EmailService;
import com.example.java.service.RedisTokenService;
import com.example.java.service.UserService;
import com.example.java.service.WorkOrderService;
import com.example.java.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    /** 管理员权限仅通过数据库 is_admin 字段判断 */
    private final UserService userService;
    private final EmailService emailService;
    private final WorkOrderService workOrderService;
    private final com.example.java.service.TrainingCourseOrderService trainingCourseOrderService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTokenService redisTokenService;
    private final JwtUtils jwtUtils;

    /**
     * 判断用户是否为管理员（is_admin 或 user_type=3）
     */
    private static boolean isAdminUser(User user) {
        return user != null && user.hasAdminRole();
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public R<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return R.success("登录成功", response);
    }

    /**
     * 用户退出登录（Phase 3：清除 Redis 中的 Token 黑名单）
     * 前端携带 Authorization: Bearer <token> 请求此接口
     */
    @PostMapping("/logout")
    public R<Void> logout(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            userService.logout(token);
        }
        return R.success("退出成功", null);
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public R<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        // 验证确认密码
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return R.error(400, "两次输入的密码不一致");
        }
        
        LoginResponse response = userService.register(request);
        return R.success("注册成功", response);
    }

    /**
     * 检查邮箱是否存在
     */
    @GetMapping("/check-email")
    public R<Boolean> checkEmailExists(@RequestParam String email) {
        boolean exists = userService.checkEmailExists(email);
        return R.success(exists);
    }

    /**
     * 检查用户名是否存在
     */
    @GetMapping("/check-username")
    public R<Boolean> checkUsernameExists(@RequestParam String username) {
        boolean exists = userService.checkUsernameExists(username);
        return R.success(exists);
    }

    /**
     * 企业展示：获取已通过审核的企业用户列表（无需登录，公开接口）
     */
    @GetMapping("/enterprises")
    public R<List<User>> listEnterprises() {
        List<User> list = userService.listEnterpriseUsers();
        list.forEach(u -> u.setPassword(null));
        return R.success("获取成功", list);
    }

    /**
     * 发送邮箱验证码
     */
    @PostMapping("/send-code")
    public R<Void> sendVerifyCode(@Valid @RequestBody SendCodeRequest request) {
        emailService.sendVerifyCode(request.getEmail());
        return R.successMsg("验证码已发送");
    }

    /**
     * 验证邮箱验证码
     */
    @PostMapping("/verify-code")
    public R<Boolean> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        boolean valid = emailService.verifyCode(request.getEmail(), request.getCode());
        return R.success(valid);
    }

    /**
     * 重置密码（通过邮箱验证码）
     */
    @PostMapping("/reset-password")
    public R<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request);
        return R.success("密码重置成功", null);
    }

    /**
     * 修改密码（通过原密码，需已登录）：使用当前登录用户的邮箱查询用户，比对原密码后更新新密码。
     */
    @PostMapping("/change-password")
    public R<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(email, request);
        return R.success("密码修改成功", null);
    }

    /**
     * 获取当前登录用户信息
     */
    @GetMapping("/info")
    public R<LoginResponse> getUserInfo() {
        // 从SecurityContext获取当前登录用户的邮箱
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userService.getUserByEmail(email);
        if (user == null) {
            return R.error(404, "用户不存在");
        }
        
        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getAvatar(),
                user.getUserType()
        );
        userInfo.setIsAdmin(isAdminUser(user));
        fillEnterpriseUserInfo(userInfo, user);

        LoginResponse response = new LoginResponse(null, null, userInfo);
        return R.success("获取用户信息成功", response);
    }

    /**
     * 更新用户资料（昵称、头像）
     */
    @PutMapping("/user/profile")
    public R<LoginResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userService.getUserByEmail(email);
        if (user == null) {
            return R.error(404, "用户不存在");
        }
        
        // 更新用户信息
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        
        userService.updateUser(user);
        
        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getAvatar(),
                user.getUserType()
        );
        userInfo.setIsAdmin(isAdminUser(user));
        fillEnterpriseUserInfo(userInfo, user);

        LoginResponse response = new LoginResponse(null, null, userInfo);
        return R.success("更新成功", response);
    }

    /**
     * 企业用户资料更新（仅审核通过的企业用户可调用，地址/电话/联系邮箱必填，网站选填）
     * 重要：修改企业关键信息后，审核状态重置为待审核
     */
    @PutMapping("/user/enterprise-profile")
    public R<LoginResponse> updateEnterpriseProfile(@Valid @RequestBody EnterpriseProfileUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            return R.error(404, "用户不存在");
        }
        if (user.getUserType() == null || user.getUserType() != 2) {
            return R.error(403, "仅企业用户可填写企业资料");
        }
        if (!Integer.valueOf(1).equals(user.getEnterpriseStatus())) {
            return R.error(403, "请等待管理员审核通过后再填写企业资料");
        }
        user.setEnterpriseAddress(request.getEnterpriseAddress().trim());
        user.setEnterprisePhone(request.getEnterprisePhone().trim());
        user.setEnterpriseContactEmail(request.getEnterpriseContactEmail().trim());
        user.setEnterpriseWebsite(request.getEnterpriseWebsite() != null ? request.getEnterpriseWebsite().trim() : null);
        user.setEnterpriseIntroduction(request.getEnterpriseIntroduction() != null ? request.getEnterpriseIntroduction().trim() : null);
        user.setEnterpriseTags(request.getEnterpriseTags() != null ? request.getEnterpriseTags().trim() : null);
        user.setEnterpriseCertifications(request.getEnterpriseCertifications() != null ? request.getEnterpriseCertifications().trim() : null);
        if (request.getEnterpriseLicense() != null && !request.getEnterpriseLicense().trim().isEmpty()) {
            user.setEnterpriseLicense(request.getEnterpriseLicense().trim());
        }

        // ========== 关键信息变更后重置审核状态 ==========
        // 如果修改了地址、电话或联系人邮箱，需要重新审核
        boolean keyInfoChanged = hasKeyInfoChanged(user, request);
        if (keyInfoChanged) {
            user.setEnterpriseStatus(0); // 重置为待审核
            userService.updateUser(user);
            UserInfo userInfo = new UserInfo(
                    user.getId(), user.getEmail(), user.getNickname(),
                    user.getAvatar(), user.getUserType()
            );
            userInfo.setIsAdmin(isAdminUser(user));
            fillEnterpriseUserInfo(userInfo, user);
            return R.success("企业资料已保存，关键信息变更后需重新审核", new LoginResponse(null, null, userInfo));
        }

        userService.updateUser(user);

        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getAvatar(),
                user.getUserType()
        );
        userInfo.setIsAdmin(isAdminUser(user));
        fillEnterpriseUserInfo(userInfo, user);
        return R.success("企业资料已保存", new LoginResponse(null, null, userInfo));
    }

    /**
     * 判断企业关键信息是否变更
     */
    private boolean hasKeyInfoChanged(User user, EnterpriseProfileUpdateRequest request) {
        // 地址变更
        if (!strEq(user.getEnterpriseAddress(), request.getEnterpriseAddress())) return true;
        // 电话变更
        if (!strEq(user.getEnterprisePhone(), request.getEnterprisePhone())) return true;
        // 联系人邮箱变更
        if (!strEq(user.getEnterpriseContactEmail(), request.getEnterpriseContactEmail())) return true;
        // 营业执照号变更
        if (!strEq(user.getEnterpriseLicense(), request.getEnterpriseLicense())) return true;
        return false;
    }

    private boolean strEq(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.trim().equals(b.trim());
    }

    private void fillEnterpriseUserInfo(UserInfo userInfo, User user) {
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

    /**
     * 发送修改邮箱验证码
     */
    @PostMapping("/send-email-change-code")
    public R<Void> sendEmailChangeCode(@Valid @RequestBody SendEmailChangeCodeRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        emailService.sendEmailChangeCode(email, request.getNewEmail());
        return R.success("验证码已发送到新邮箱", null);
    }

    /**
     * 修改绑定邮箱
     */
    @PutMapping("/user/email")
    public R<LoginResponse> changeEmail(@Valid @RequestBody ChangeEmailRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        // 验证验证码
        if (!emailService.verifyCode(request.getNewEmail(), request.getCode())) {
            return R.error(400, "验证码错误或已过期");
        }
        
        // 检查新邮箱是否已被注册
        if (userService.checkEmailExists(request.getNewEmail())) {
            return R.error(400, "该邮箱已被注册");
        }
        
        User user = userService.getUserByEmail(email);
        if (user == null) {
            return R.error(404, "用户不存在");
        }
        
        // 更新邮箱
        user.setEmail(request.getNewEmail());
        userService.updateUser(user);

        // 清除所有旧 Token，颁发新 Token（旧 Token 中存储的是旧邮箱，后续鉴权会失败）
        redisTokenService.removeTokensByUserId(user.getId());
        String newToken = jwtUtils.generateToken(user.getId(), user.getNickname(), user.getEmail());
        redisTokenService.saveToken(newToken, user.getId(), jwtUtils.getExpirationMillis());

        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getAvatar(),
                user.getUserType()
        );
        userInfo.setIsAdmin(isAdminUser(user));
        fillEnterpriseUserInfo(userInfo, user);

        LoginResponse response = new LoginResponse(newToken, jwtUtils.getExpiration(), userInfo);
        return R.success("邮箱修改成功", response);
    }

    /**
     * 管理员重置用户密码
     */
    @PutMapping("/admin/users/{userId}/password")
    public R<Void> adminResetPassword(
            @PathVariable String userId,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        // 检查当前登录用户是否为管理员
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User admin = userService.getUserByEmail(email);
        if (!isAdminUser(admin)) {
            return R.error(403, "无权限操作");
        }
        
        userService.adminResetPassword(userId, request.getNewPassword());
        return R.success("密码重置成功", null);
    }

    /**
     * 管理员注销用户账户
     */
    @DeleteMapping("/admin/users/{userId}")
    public R<Void> adminDeleteUser(@PathVariable String userId) {
        // 检查当前登录用户是否为管理员
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User admin = userService.getUserByEmail(email);
        if (!isAdminUser(admin)) {
            return R.error(403, "无权限操作");
        }
        
        userService.deleteUser(userId);
        return R.success("用户已注销", null);
    }

    // ==================== 工单接口 ====================

    /**
     * 创建工单
     */
    @PostMapping("/work-orders")
    public R<WorkOrder> createWorkOrder(@RequestBody WorkOrderCreateRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        WorkOrder order = workOrderService.create(user.getId(), request);
        return R.success("工单已提交", order);
    }

    /**
     * 当前用户的工单列表
     */
    @GetMapping("/work-orders")
    public R<List<WorkOrder>> listMyWorkOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        List<WorkOrder> list = workOrderService.listByUserId(user.getId());
        return R.success(list);
    }

    /**
     * 管理员：全部工单列表
     */
    @GetMapping("/admin/work-orders")
    public R<List<WorkOrder>> listAllWorkOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User admin = userService.getUserByEmail(auth.getName());
        if (admin == null || !isAdminUser(admin)) return R.error(403, "无权限操作");
        List<WorkOrder> list = workOrderService.listAll();
        return R.success(list);
    }

    /**
     * 工单详情（含回复列表）
     */
    @GetMapping("/work-orders/{id}")
    public R<WorkOrder> getWorkOrderDetail(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        WorkOrder order = workOrderService.getDetail(id, user.getId(), isAdminUser(user));
        return R.success(order);
    }

    /**
     * 回复工单
     */
    @PostMapping("/work-orders/{id}/reply")
    public R<Map<String, String>> replyWorkOrder(@PathVariable String id, @RequestBody WorkOrderReplyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        boolean admin = isAdminUser(user);
        Map<String, String> data = workOrderService.reply(id, user.getId(), admin, request);
        // 与 WebSocket 发送路径一致，通知订阅 /topic/work-order/{id} 的客户端（含用户端工单页）
        String content = request.getContent() != null ? request.getContent().trim() : "";
        String time = data != null ? data.get("time") : "";
        String role = admin ? "admin" : "user";
        messagingTemplate.convertAndSend("/topic/work-order/" + id, new WorkOrderChatMessage(role, content, time));
        return R.success("回复已发送", data);
    }

    /**
     * 关闭工单（仅本人可关闭）
     */
    @PutMapping("/work-orders/{id}/close")
    public R<Void> closeWorkOrder(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        workOrderService.close(id, user.getId());
        return R.success("工单已关闭", null);
    }

    // ==================== 培训课程订单接口 ====================

    /**
     * 创建培训课程订单（支付后直接创建已支付订单）
     */
    @PostMapping("/training-orders")
    public R<com.example.java.entity.TrainingCourseOrder> createTrainingOrder(@RequestBody java.util.Map<String, Integer> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        
        Integer courseId = request != null ? request.get("courseId") : null;
        if (courseId == null) {
            return R.error(400, "课程ID不能为空");
        }
        
        com.example.java.entity.TrainingCourseOrder order = trainingCourseOrderService.create(user.getId(), courseId);
        return R.success("订单创建成功", order);
    }

    /**
     * 获取当前用户的培训课程订单列表
     */
    @GetMapping("/training-orders")
    public R<List<com.example.java.entity.TrainingCourseOrder>> listMyTrainingOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByEmail(auth.getName());
        if (user == null) return R.error(401, "请先登录");
        
        List<com.example.java.entity.TrainingCourseOrder> list = trainingCourseOrderService.listByUserId(user.getId());
        return R.success(list);
    }
}
