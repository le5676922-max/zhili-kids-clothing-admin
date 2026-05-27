package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.CartAddRequest;
import com.example.java.dto.CartItemVO;
import com.example.java.entity.User;
import com.example.java.service.CartService;
import com.example.java.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 购物车接口（需登录）
 */
@RestController
@RequestMapping("/api/auth/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserService userService;

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
     * 加入购物车
     */
    @PostMapping
    public R<Void> add(@Valid @RequestBody CartAddRequest request) {
        String userId = getCurrentUserId();
        cartService.add(userId, request);
        return R.success("已加入购物车", null);
    }

    /**
     * 购物车列表
     */
    @GetMapping
    public R<List<CartItemVO>> list() {
        String userId = getCurrentUserId();
        List<CartItemVO> list = cartService.list(userId);
        return R.success(list);
    }

    /**
     * 购物车商品总件数（用于头部角标）
     */
    @GetMapping("/count")
    public R<Integer> count() {
        String userId = getCurrentUserId();
        int count = cartService.count(userId);
        return R.success(count);
    }

    /**
     * 修改数量
     */
    @PutMapping("/{id}")
    public R<Void> updateQuantity(@PathVariable Integer id, @RequestBody Map<String, Integer> body) {
        String userId = getCurrentUserId();
        Integer quantity = body != null ? body.get("quantity") : null;
        cartService.updateQuantity(userId, id, quantity);
        return R.success("已更新", null);
    }

    /**
     * 删除购物车项
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Integer id) {
        String userId = getCurrentUserId();
        cartService.delete(userId, id);
        return R.success("已删除", null);
    }
}
