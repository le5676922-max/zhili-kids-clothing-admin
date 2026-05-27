package com.example.java.service.impl;

import com.example.java.dto.JobApplicationVO;
import com.example.java.dto.MyJobApplicationVO;
import com.example.java.entity.JobApplication;
import com.example.java.entity.JobPosition;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.JobApplicationMapper;
import com.example.java.service.JobApplicationService;
import com.example.java.service.JobPositionService;
import com.example.java.service.NotificationService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 职位申请服务实现
 */
@Service
@RequiredArgsConstructor
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationMapper jobApplicationMapper;
    private final JobPositionService jobPositionService;
    private final NotificationService notificationService;
    private final UserService userService;

    @Override
    public List<JobApplicationVO> listReceivedByEnterprise(String enterpriseUserId) {
        return jobApplicationMapper.selectReceivedByEnterpriseUserId(enterpriseUserId);
    }

    @Override
    public List<MyJobApplicationVO> listMyApplications(String userId) {
        return jobApplicationMapper.selectByApplicantUserId(userId);
    }

    @Override
    public void apply(String userId, Integer jobId, String resumeUrl) {
        if (resumeUrl == null || resumeUrl.isBlank()) {
            throw new BusinessException("请先上传简历");
        }
        JobPosition job = jobPositionService.getPositionById(jobId);
        if (job == null) {
            throw new BusinessException("职位不存在");
        }
        if (job.getStatus() != null && job.getStatus() != 1) {
            throw new BusinessException("该职位已结束招聘");
        }
        JobApplication existing = jobApplicationMapper.selectByUserIdAndJobId(userId, jobId);
        if (existing != null) {
            throw new BusinessException("您已投递过该职位");
        }
        JobApplication application = new JobApplication();
        application.setUserId(userId);
        application.setJobId(jobId);
        application.setResumeUrl(resumeUrl.trim());
        application.setStatus(0);
        jobApplicationMapper.insert(application);

        // ========== 发站内通知给招聘企业 ==========
        if (job.getUserId() != null && !job.getUserId().equals(userId)) {
            String applicantName = "";
            User applicant = userService.getUserById(userId);
            if (applicant != null) {
                applicantName = applicant.getNickname() != null ? applicant.getNickname() : applicant.getEmail();
            }
            notificationService.notify(
                    job.getUserId(),
                    "job_application_received",
                    "收到新简历",
                    String.format("「%s」投递了您的职位「%s」，请及时查看处理。",
                            applicantName,
                            job.getJobName() != null ? job.getJobName() : "未知职位"),
                    application.getId(),
                    "job_application"
            );
        }
    }

    /**
     * 更新申请状态（企业处理简历）
     */
    @Override
    @Transactional
    public boolean updateStatus(Integer applicationId, Integer status, String enterpriseUserId) {
        if (status == null || status < 0 || status > 3) {
            throw new BusinessException("无效的状态值");
        }
        JobApplicationVO app = jobApplicationMapper.selectById(applicationId);
        if (app == null) {
            throw new BusinessException("申请记录不存在");
        }
        // 校验该简历属于当前企业发布的职位
        JobPosition job = jobPositionService.getPositionById(app.getJobId());
        if (job == null || !enterpriseUserId.equals(job.getUserId())) {
            throw new BusinessException("无权操作该简历");
        }
        int result = jobApplicationMapper.updateStatus(applicationId, status);

        // ========== 发站内通知给申请人 ==========
        if (result > 0) {
            String jobName = job.getJobName() != null ? job.getJobName() : "未知职位";
            String statusText = switch (status) {
                case 1 -> "已查看";
                case 2 -> "已通过";
                case 3 -> "已拒绝";
                default -> "待查看";
            };
            notificationService.notify(
                    app.getApplicantId(),
                    "job_application_status_changed",
                    "简历状态更新",
                    String.format("您投递的职位「%s」的简历状态已更新为「%s」。", jobName, statusText),
                    applicationId,
                    "job_application"
            );
        }
        return result > 0;
    }
}
