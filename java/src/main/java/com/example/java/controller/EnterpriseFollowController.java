package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.User;
import com.example.java.service.EnterpriseFollowService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 企业关注接口
 */
@RestController
@RequestMapping("/api/auth/enterprise")
@RequiredArgsConstructor
public class EnterpriseFollowController {

    private final EnterpriseFollowService followService;
    private final UserService userService;

    /**
     * 获取当前用户ID
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new com.example.java.exception.BusinessException("请先登录");
        }
        return user.getId();
    }

    /**
     * 关注企业
     * POST /api/auth/enterprise/follow/{enterpriseId}
     */
    @PostMapping("/follow/{enterpriseId}")
    public R<Void> follow(@PathVariable String enterpriseId) {
        String userId = getCurrentUserId();
        followService.follow(userId, enterpriseId);
        return R.success("关注成功", null);
    }

    /**
     * 取消关注
     * DELETE /api/auth/enterprise/follow/{enterpriseId}
     */
    @DeleteMapping("/follow/{enterpriseId}")
    public R<Void> unfollow(@PathVariable String enterpriseId) {
        String userId = getCurrentUserId();
        followService.unfollow(userId, enterpriseId);
        return R.success("取消关注成功", null);
    }

    /**
     * 检查是否已关注
     * GET /api/auth/enterprise/follow/{enterpriseId}/check
     */
    @GetMapping("/follow/{enterpriseId}/check")
    public R<Boolean> checkFollow(@PathVariable String enterpriseId) {
        String userId = getCurrentUserId();
        boolean following = followService.isFollowing(userId, enterpriseId);
        return R.success(following);
    }

    /**
     * 获取当前用户的关注列表
     * GET /api/auth/enterprise/following
     */
    @GetMapping("/following")
    public R<List<User>> getFollowingList() {
        String userId = getCurrentUserId();
        List<User> list = followService.getFollowingList(userId);
        // 清除敏感信息
        list.forEach(u -> u.setPassword(null));
        return R.success(list);
    }

    /**
     * 获取企业的粉丝数量
     * GET /api/auth/enterprise/{enterpriseId}/followers/count
     */
    @GetMapping("/{enterpriseId}/followers/count")
    public R<Integer> getFollowerCount(@PathVariable String enterpriseId) {
        int count = followService.getFollowerCount(enterpriseId);
        return R.success(count);
    }

    /**
     * 获取企业的粉丝列表
     * GET /api/auth/enterprise/{enterpriseId}/followers
     */
    @GetMapping("/{enterpriseId}/followers")
    public R<List<String>> getFollowerList(@PathVariable String enterpriseId) {
        List<String> followerIds = followService.getFollowerIds(enterpriseId);
        return R.success(followerIds);
    }
}
