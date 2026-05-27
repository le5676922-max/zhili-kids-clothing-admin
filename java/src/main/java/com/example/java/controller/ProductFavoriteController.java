package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.ProductFavoriteService;
import com.example.java.service.ProductService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth/favorites")
@RequiredArgsConstructor
public class ProductFavoriteController {

    private final ProductFavoriteService favoriteService;
    private final ProductService productService;
    private final UserService userService;

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) throw new BusinessException("请先登录");
        return user.getId();
    }

    /** 获取我的收藏产品ID列表（初始化产品页时判断哪些产品被收藏） */
    @GetMapping
    public R<Map<String, Boolean>> listIds() {
        String userId = getCurrentUserId();
        List<String> ids = favoriteService.listFavorites(userId);
        Map<String, Boolean> result = new HashMap<>();
        for (String id : ids) {
            result.put(id, true);
        }
        return R.success(result);
    }

    /** 添加收藏 */
    @PostMapping("/{productId}")
    public R<Void> add(@PathVariable String productId) {
        String userId = getCurrentUserId();
        favoriteService.addFavorite(userId, productId);
        return R.success("收藏成功", null);
    }

    /** 取消收藏 */
    @DeleteMapping("/{productId}")
    public R<Void> remove(@PathVariable String productId) {
        String userId = getCurrentUserId();
        favoriteService.removeFavorite(userId, productId);
        return R.success("已取消收藏", null);
    }
}
