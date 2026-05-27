package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.NotificationVO;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.NotificationService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 站内通知接口
 */
@RestController
@RequestMapping("/api/auth/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new BusinessException("请先登录");
        }
        return user.getId();
    }

    /** 查询当前用户所有通知 */
    @GetMapping
    public R<List<NotificationVO>> list() {
        String userId = getCurrentUserId();
        List<NotificationVO> list = notificationService.listByUser(userId);
        return R.success(list);
    }

    /** 未读通知数量 */
    @GetMapping("/unread-count")
    public R<Integer> unreadCount() {
        String userId = getCurrentUserId();
        return R.success(notificationService.unreadCount(userId));
    }

    /** 标记单条通知为已读 */
    @PutMapping("/{id}/read")
    public R<Void> markRead(@PathVariable Long id) {
        String userId = getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return R.success();
    }

    /** 全部标为已读 */
    @PutMapping("/read-all")
    public R<Void> markAllRead() {
        String userId = getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return R.success();
    }
}
