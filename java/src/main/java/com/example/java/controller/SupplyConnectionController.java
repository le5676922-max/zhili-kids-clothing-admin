package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.MyPublishedItemVO;
import com.example.java.dto.SupplyConnectionCreateRequest;
import com.example.java.dto.SupplyConnectionVO;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.SupplyConnectionService;
import com.example.java.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 供需对接接口
 * - 查看对接记录：公开
 * - 创建/更新/删除对接：需登录 + 企业审核通过
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SupplyConnectionController {

    private final SupplyConnectionService connectionService;
    private final UserService userService;

    /**
     * 获取当前用户相关的所有对接记录
     */
    @GetMapping("/supply/connections/my")
    public R<List<SupplyConnectionVO>> getMyConnections() {
        User user = getCurrentUserQuietly();
        if (user == null) {
            return R.fail(401, "请先登录");
        }
        List<SupplyConnectionVO> list = connectionService.getMyConnections(user.getId());
        return R.success(list);
    }

    /**
     * 获取我发布的供需列表（含对接状态和合作方信息）
     */
    @GetMapping("/supply/connections/published")
    public R<List<MyPublishedItemVO>> getMyPublishedItems() {
        User user = getCurrentUserQuietly();
        if (user == null) {
            return R.fail(401, "请先登录");
        }
        List<MyPublishedItemVO> list = connectionService.getMyPublishedItems(user.getId());
        return R.success(list);
    }

    /**
     * 根据ID获取对接记录详情
     */
    @GetMapping("/supply/connections/{id}")
    public R<SupplyConnectionVO> getById(@PathVariable Integer id) {
        SupplyConnectionVO connection = connectionService.getConnectionById(id);
        return R.success(connection);
    }

    /**
     * 根据需求ID获取所有对接记录
     */
    @GetMapping("/supply/connections/demand/{demandId}")
    public R<List<SupplyConnectionVO>> getByDemandId(@PathVariable Integer demandId) {
        List<SupplyConnectionVO> list = connectionService.getConnectionsByDemandId(demandId);
        return R.success(list);
    }

    /**
     * 根据供应ID获取所有对接记录
     */
    @GetMapping("/supply/connections/supply/{supplyId}")
    public R<List<SupplyConnectionVO>> getBySupplyId(@PathVariable Integer supplyId) {
        List<SupplyConnectionVO> list = connectionService.getConnectionsBySupplyId(supplyId);
        return R.success(list);
    }

    /**
     * 创建对接记录：需登录 + 企业审核通过
     */
    @PostMapping("/supply/connections")
    public R<Integer> create(@RequestBody SupplyConnectionCreateRequest request) {
        User user = requireApprovedEnterprise();

        // 验证必填字段（双重校验：Controller层 + Service层）
        if ((request.getDemandId() == null && request.getSupplyId() == null)
                || (request.getDemandId() != null && request.getSupplyId() != null)) {
            throw new BusinessException(400, "必须指定需求或供应之一，不能同时指定");
        }

        Integer connectionId = connectionService.createConnection(request, user);
        return R.success(connectionId);
    }

    /**
     * 更新对接状态：需登录 + 对接相关方
     */
    @PutMapping("/supply/connections/{id}/status")
    public R<Void> updateStatus(@PathVariable Integer id, @RequestParam String status) {
        User user = requireApprovedEnterprise();
        boolean success = connectionService.updateConnectionStatus(id, status, user.getId());
        return success ? R.successMsg("状态更新成功") : R.fail("状态更新失败");
    }

    /**
     * 删除对接记录：需登录 + 对接相关方
     */
    @DeleteMapping("/supply/connections/{id}")
    public R<Void> delete(@PathVariable Integer id) {
        User user = requireApprovedEnterprise();
        boolean success = connectionService.deleteConnection(id, user.getId());
        return success ? R.successMsg("删除成功") : R.fail("删除失败");
    }

    /**
     * 获取当前登录用户（无 token/未登录时返回 null）
     */
    private User getCurrentUserQuietly() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String email = auth.getName();
        if (email == null || email.isBlank()) return null;
        return userService.getUserByEmail(email);
    }

    /**
     * 要求企业审核通过
     */
    private User requireApprovedEnterprise() {
        User user = getCurrentUserQuietly();
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (user.getUserType() == null || user.getUserType() != 2) {
            throw new BusinessException(403, "仅企业用户可使用此功能");
        }
        if (!Integer.valueOf(1).equals(user.getEnterpriseStatus())) {
            if (Integer.valueOf(0).equals(user.getEnterpriseStatus())) {
                throw new BusinessException(403, "您的企业账号正在等待管理员审核，审核通过后方可使用此功能");
            }
            throw new BusinessException(403, "您的企业账号尚未通过审核，暂无法使用此功能");
        }
        return user;
    }
}
