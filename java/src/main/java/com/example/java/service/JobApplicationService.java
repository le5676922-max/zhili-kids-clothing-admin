package com.example.java.service;

import com.example.java.dto.JobApplicationVO;
import com.example.java.dto.MyJobApplicationVO;

import java.util.List;

/**
 * 职位申请服务
 */
public interface JobApplicationService {

    /**
     * 投递简历申请职位
     * @param userId 申请人用户ID
     * @param jobId 职位ID
     * @param resumeUrl 简历图片 OSS 地址
     */
    void apply(String userId, Integer jobId, String resumeUrl);

    /**
     * 企业端：查询投递到本企业职位下的所有简历申请
     * @param enterpriseUserId 企业用户ID
     */
    List<JobApplicationVO> listReceivedByEnterprise(String enterpriseUserId);

    /**
     * 个人端：我投递过的职位列表
     */
    List<MyJobApplicationVO> listMyApplications(String userId);

    /**
     * 更新简历申请状态（企业操作：查看/通过/拒绝）
     * @param applicationId 申请记录ID
     * @param status 状态：0-待查看, 1-已查看, 2-已通过, 3-已拒绝
     * @param enterpriseUserId 企业用户ID（用于校验归属权）
     */
    boolean updateStatus(Integer applicationId, Integer status, String enterpriseUserId);
}
