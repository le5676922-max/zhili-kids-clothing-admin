package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.JobApplicationVO;
import com.example.java.dto.MyJobApplicationVO;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.service.JobApplicationService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 职位申请接口（需登录）
 */
@RestController
@RequestMapping("/api/auth/job-applications")
@RequiredArgsConstructor
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;
    private final UserService userService;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new BusinessException("请先登录");
        }
        return user;
    }

    private String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * 投递简历申请职位
     * body: { "jobId": 1, "resumeUrl": "https://..." }
     */
    @PostMapping
    public R<Void> apply(@RequestBody Map<String, Object> body) {
        User user = getCurrentUser();
        if (user.getUserType() == null || user.getUserType() != 1) {
            return R.fail("仅个人用户可投递简历");
        }
        String userId = user.getId();
        Object j = body.get("jobId");
        Integer jobId = j instanceof Number ? ((Number) j).intValue() : null;
        String resumeUrl = body.get("resumeUrl") != null ? body.get("resumeUrl").toString() : null;
        if (jobId == null) {
            return R.fail("请选择职位");
        }
        jobApplicationService.apply(userId, jobId, resumeUrl);
        return R.successMsg("投递成功");
    }

    /**
     * 个人端：我投递过的职位（已投简历）
     */
    @GetMapping("/mine")
    public R<List<MyJobApplicationVO>> listMine() {
        User user = getCurrentUser();
        if (user.getUserType() == null || user.getUserType() != 1) {
            throw new BusinessException("仅个人用户可查看已投简历");
        }
        List<MyJobApplicationVO> list = jobApplicationService.listMyApplications(user.getId());
        return R.success(list);
    }

    /**
     * 企业端：查询收到的简历列表（仅审核通过的企业用户）
     */
    @GetMapping("/received")
    public R<List<JobApplicationVO>> listReceived() {
        User user = requireApprovedEnterprise();
        List<JobApplicationVO> list = jobApplicationService.listReceivedByEnterprise(user.getId());
        return R.success(list);
    }

    /**
     * 企业端：更新简历状态（查看/通过/拒绝）
     * body: { "applicationId": 1, "status": 2 }
     */
    @PutMapping("/status")
    public R<Void> updateStatus(@RequestBody Map<String, Object> body) {
        User user = requireApprovedEnterprise();
        Object aId = body.get("applicationId");
        Object s = body.get("status");
        if (aId == null) {
            return R.fail("applicationId 不能为空");
        }
        if (s == null) {
            return R.fail("status 不能为空");
        }
        Integer applicationId = aId instanceof Number ? ((Number) aId).intValue() : null;
        Integer status = s instanceof Number ? ((Number) s).intValue() : null;
        if (applicationId == null || status == null) {
            return R.fail("参数格式错误");
        }
        jobApplicationService.updateStatus(applicationId, status, user.getId());
        return R.successMsg("状态更新成功");
    }

    /**
     * 要求企业审核通过。
     */
    private User requireApprovedEnterprise() {
        User user = getCurrentUser();
        if (user.getUserType() == null || user.getUserType() != 2) {
            throw new BusinessException("仅企业用户可使用此功能");
        }
        if (!Integer.valueOf(1).equals(user.getEnterpriseStatus())) {
            if (Integer.valueOf(0).equals(user.getEnterpriseStatus())) {
                throw new BusinessException("您的企业账号正在等待管理员审核，审核通过后方可使用招聘功能");
            }
            throw new BusinessException("您的企业账号尚未通过审核，暂无法使用招聘功能");
        }
        return user;
    }
}
