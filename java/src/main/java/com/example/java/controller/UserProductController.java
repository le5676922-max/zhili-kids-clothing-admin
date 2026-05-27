package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.ProductCreateOrUpdateRequest;
import com.example.java.dto.ProductVO;
import com.example.java.entity.User;
import com.example.java.service.ProductService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 用户产品控制器（需要登录认证）
 * 商家：上架/下架商品、编辑商品信息与价格
 */
@RestController
@RequestMapping("/api/auth/products")
@RequiredArgsConstructor
public class UserProductController {

    private final ProductService productService;
    private final UserService userService;

    /**
     * 获取当前用户发布的产品列表（含上架与下架）。
     * 待审核/已拒绝的企业用户也可以查看自己的产品记录。
     */
    @GetMapping("/my")
    public R<List<ProductVO>> getMyProducts() {
        String userId = getCurrentUserId();
        List<ProductVO> list = productService.listByUserId(userId);
        return R.success(list);
    }

    /**
     * 创建商品（上架新品）：仅审核通过的企业用户可操作
     */
    @PostMapping
    public R<ProductVO> create(@RequestBody ProductCreateOrUpdateRequest request) {
        User user = requireApprovedEnterprise();
        ProductVO vo = productService.create(request, user.getId());
        return R.success("上架成功", vo);
    }

    /**
     * 更新商品信息与价格：仅审核通过的企业用户可操作
     */
    @PutMapping("/{id}")
    public R<Void> update(@PathVariable String id, @RequestBody ProductCreateOrUpdateRequest request) {
        User user = requireApprovedEnterprise();
        productService.update(id, request, user.getId());
        return R.success();
    }

    /**
     * 上架/下架商品：仅审核通过的企业用户可操作
     * 请求体示例：{"status": 1} 上架，{"status": 0} 下架
     */
    @PatchMapping("/{id}/status")
    public R<Void> updateStatus(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        Integer status = body != null ? body.get("status") : null;
        if (status == null) {
            return R.error(400, "缺少 status 参数");
        }
        User user = requireApprovedEnterprise();
        productService.updateStatus(id, status, user.getId());
        return R.success();
    }

    /**
     * 要求为企业用户且审核已通过。
     * 待审核(status=0)或已拒绝(status=2)时均无企业功能权限。
     */
    private User requireApprovedEnterprise() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new com.example.java.exception.BusinessException("请先登录");
        }
        if (user.getUserType() == null || user.getUserType() != 2) {
            throw new com.example.java.exception.BusinessException("仅企业用户可使用此功能");
        }
        if (!Integer.valueOf(1).equals(user.getEnterpriseStatus())) {
            if (Integer.valueOf(0).equals(user.getEnterpriseStatus())) {
                throw new com.example.java.exception.BusinessException("您的企业账号正在等待管理员审核，审核通过后方可使用企业功能");
            }
            if (Integer.valueOf(2).equals(user.getEnterpriseStatus())) {
                throw new com.example.java.exception.BusinessException("您的企业账号审核未通过，暂无法使用企业功能");
            }
            throw new com.example.java.exception.BusinessException("您的企业账号尚未通过审核，暂无法使用企业功能");
        }
        return user;
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new com.example.java.exception.BusinessException("请先登录");
        }
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new com.example.java.exception.BusinessException("请先登录");
        }
        return user.getId();
    }
}
