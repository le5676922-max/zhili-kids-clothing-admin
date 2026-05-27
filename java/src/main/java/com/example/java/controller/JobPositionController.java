package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.JobPosition;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.JobPositionService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 招聘职位接口
 * - 列表/搜索/详情：公开，无需登录
 * - 发布/更新/删除：需登录 + 企业审核通过
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class JobPositionController {

    private final JobPositionService jobPositionService;
    private final UserService userService;

    /**
     * 获取所有招聘中的职位列表
     */
    @GetMapping("/jobs")
    public R<List<JobPosition>> list() {
        List<JobPosition> list = jobPositionService.getAllPositions();
        return R.success(list);
    }

    /**
     * 搜索/筛选职位列表
     * 支持参数：keyword, category, experience, education, salary
     */
    @GetMapping("/jobs/search")
    public R<List<JobPosition>> search(@RequestParam Map<String, String> params) {
        String keyword = params.get("keyword");
        String category = params.get("category");
        String experience = params.get("experience");
        String education = params.get("education");
        String salary = params.get("salary");

        List<JobPosition> list = jobPositionService.searchPositions(keyword, category, experience, education, salary);
        return R.success(list);
    }

    /**
     * 根据ID获取职位详情（增加浏览次数）
     */
    @GetMapping("/jobs/{id}")
    public R<JobPosition> getById(@PathVariable Integer id) {
        JobPosition jobPosition = jobPositionService.getPositionById(id);
        if (jobPosition != null) {
            // 增加浏览次数
            jobPositionService.incrementViewCount(id);
        }
        return R.success(jobPosition);
    }

    /**
     * 根据用户ID获取职位列表（企业用户查看自己发布的职位）
     */
    @GetMapping("/jobs/user/{userId}")
    public R<List<JobPosition>> getByUserId(@PathVariable String userId) {
        List<JobPosition> list = jobPositionService.getPositionsByUserId(userId);
        return R.success(list);
    }

    /**
     * 发布职位：需登录 + 企业审核通过
     */
    @PostMapping("/jobs")
    public R<Void> publish(@RequestBody JobPosition jobPosition) {
        User user = requireApprovedEnterprise();
        jobPosition.setUserId(user.getId());
        boolean success = jobPositionService.publishPosition(jobPosition);
        return success ? R.<Void>successMsg("发布成功") : R.<Void>fail("发布失败");
    }

    /**
     * 更新职位：需登录 + 企业审核通过 + 归属验证
     */
    @PutMapping("/jobs/{id}")
    public R<Void> update(@PathVariable Integer id, @RequestBody JobPosition jobPosition) {
        User user = requireApprovedEnterprise();
        jobPosition.setId(id);
        boolean success = jobPositionService.updatePosition(id, jobPosition, user.getId());
        return success ? R.<Void>successMsg("更新成功") : R.<Void>fail("更新失败");
    }

    /**
     * 删除职位：需登录 + 企业审核通过 + 归属验证
     */
    @DeleteMapping("/jobs/{id}")
    public R<Void> delete(@PathVariable Integer id) {
        User user = requireApprovedEnterprise();
        boolean success = jobPositionService.deletePosition(id, user.getId());
        return success ? R.<Void>successMsg("删除成功") : R.<Void>fail("删除失败");
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
     * 要求企业审核通过。
     * 待审核(status=0)或已拒绝(status=2)时均无招聘功能权限。
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
                throw new BusinessException(403, "您的企业账号正在等待管理员审核，审核通过后方可使用招聘功能");
            }
            throw new BusinessException(403, "您的企业账号尚未通过审核，暂无法使用招聘功能");
        }
        return user;
    }
}
