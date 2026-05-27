package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.SupplyDemandCreateRequest;
import com.example.java.dto.SupplyDemandVO;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.SupplyDemandService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 需求信息接口
 * - 列表/搜索/详情：公开，无需登录
 * - 发布/更新/删除：需登录 + 企业审核通过
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SupplyDemandController {

    private final SupplyDemandService supplyDemandService;
    private final UserService userService;

    /**
     * 获取所有需求列表
     */
    @GetMapping("/supply/demands")
    public R<List<SupplyDemandVO>> list() {
        List<SupplyDemandVO> list = supplyDemandService.getAllDemands();
        return R.success(list);
    }

    /**
     * 搜索/筛选需求列表
     * 支持参数：keyword, type, urgency, status
     */
    @GetMapping("/supply/demands/search")
    public R<List<SupplyDemandVO>> search(@RequestParam Map<String, String> params) {
        String keyword = params.get("keyword");
        String type = params.get("type");
        String urgency = params.get("urgency");
        String status = params.get("status");

        List<SupplyDemandVO> list = supplyDemandService.searchDemands(keyword, type, urgency, status);
        return R.success(list);
    }

    /**
     * 根据ID获取需求详情（Service层已包含浏览次数增加）
     */
    @GetMapping("/supply/demands/{id}")
    public R<SupplyDemandVO> getById(@PathVariable Integer id) {
        SupplyDemandVO demand = supplyDemandService.getDemandById(id);
        return R.success(demand);
    }

    /**
     * 根据用户ID获取需求列表（企业用户查看自己发布的需求）
     */
    @GetMapping("/supply/demands/user/{userId}")
    public R<List<SupplyDemandVO>> getByUserId(@PathVariable String userId) {
        List<SupplyDemandVO> list = supplyDemandService.getDemandsByUserId(userId);
        return R.success(list);
    }

    /**
     * 发布需求：需登录 + 企业审核通过
     */
    @PostMapping("/supply/demands")
    public R<Void> publish(@RequestBody SupplyDemandCreateRequest request) {
        User user = requireApprovedEnterprise();
        
        // 验证必填字段
        validateDemandRequest(request);
        
        boolean success = supplyDemandService.publishDemand(request, user.getId());
        return success ? R.<Void>successMsg("发布成功") : R.<Void>fail("发布失败");
    }

    /**
     * 更新需求：需登录 + 企业审核通过 + 归属验证
     */
    @PutMapping("/supply/demands/{id}")
    public R<Void> update(@PathVariable Integer id, @RequestBody SupplyDemandCreateRequest request) {
        User user = requireApprovedEnterprise();

        // 验证必填字段
        validateDemandRequest(request);

        // 归属验证：只能修改自己发布的需求
        SupplyDemandVO existing = supplyDemandService.getDemandById(id);
        if (existing == null) {
            return R.fail("需求不存在");
        }
        if (!user.getId().equals(existing.getUserId())) {
            return R.error(403, "无权修改此需求");
        }

        boolean success = supplyDemandService.updateDemand(id, request);
        return success ? R.<Void>successMsg("更新成功") : R.<Void>fail("更新失败");
    }

    /**
     * 删除需求：需登录 + 企业审核通过 + 归属验证
     */
    @DeleteMapping("/supply/demands/{id}")
    public R<Void> delete(@PathVariable Integer id) {
        User user = requireApprovedEnterprise();

        // 归属验证：只能删除自己发布的需求
        SupplyDemandVO existing = supplyDemandService.getDemandById(id);
        if (existing == null) {
            return R.fail("需求不存在");
        }
        if (!user.getId().equals(existing.getUserId())) {
            return R.error(403, "无权删除此需求");
        }

        boolean success = supplyDemandService.deleteDemand(id);
        return success ? R.<Void>successMsg("删除成功") : R.<Void>fail("删除失败");
    }

    /**
     * 验证需求请求的必填字段
     */
    private void validateDemandRequest(SupplyDemandCreateRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BusinessException(400, "需求标题不能为空");
        }
        if (request.getType() == null || request.getType().trim().isEmpty()) {
            throw new BusinessException(400, "需求类型不能为空");
        }
        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            throw new BusinessException(400, "需求类别不能为空");
        }
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new BusinessException(400, "需求描述不能为空");
        }
        if (request.getContactName() == null || request.getContactName().trim().isEmpty()) {
            throw new BusinessException(400, "联系人不能为空");
        }
        if (request.getContactPhone() == null || request.getContactPhone().trim().isEmpty()) {
            throw new BusinessException(400, "联系电话不能为空");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BusinessException(400, "邮箱不能为空");
        }
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
