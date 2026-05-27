package com.example.java.service;

import com.example.java.entity.JobPosition;

import java.util.List;

/**
 * 招聘职位服务
 */
public interface JobPositionService {

    /**
     * 获取所有招聘中的职位列表（含企业信息）
     */
    List<JobPosition> getAllPositions();

    /**
     * 搜索/筛选职位列表
     */
    List<JobPosition> searchPositions(String keyword, String category, String experience, String education, String salary);

    /**
     * 根据ID获取职位详情
     */
    JobPosition getPositionById(Integer id);

    /**
     * 根据用户ID获取职位列表
     */
    List<JobPosition> getPositionsByUserId(String userId);

    /**
     * 发布职位
     */
    boolean publishPosition(JobPosition jobPosition);

    /**
     * 更新职位（需归属验证）
     */
    boolean updatePosition(Integer positionId, JobPosition jobPosition, String userId);

    /**
     * 删除职位（需归属验证）
     */
    boolean deletePosition(Integer id, String userId);

    /**
     * 增加浏览次数
     */
    void incrementViewCount(Integer id);
}
