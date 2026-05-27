package com.example.java.service.impl;

import com.example.java.entity.JobPosition;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.JobPositionMapper;
import com.example.java.service.JobPositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 招聘职位服务实现
 */
@Service
@RequiredArgsConstructor
public class JobPositionServiceImpl implements JobPositionService {

    private final JobPositionMapper jobPositionMapper;

    @Override
    public List<JobPosition> getAllPositions() {
        return jobPositionMapper.findAll();
    }

    @Override
    public List<JobPosition> searchPositions(String keyword, String category, String experience, String education, String salary) {
        return jobPositionMapper.search(keyword, category, experience, education, salary);
    }

    @Override
    public JobPosition getPositionById(Integer id) {
        return jobPositionMapper.selectById(id);
    }

    @Override
    public List<JobPosition> getPositionsByUserId(String userId) {
        return jobPositionMapper.findByUserId(userId);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public boolean publishPosition(JobPosition jobPosition) {
        jobPosition.setCreatedAt(LocalDateTime.now());
        jobPosition.setUpdatedAt(LocalDateTime.now());
        jobPosition.setPublishedAt(LocalDateTime.now());
        jobPosition.setStatus(1);
        jobPosition.setViewCount(0);
        return jobPositionMapper.insert(jobPosition) > 0;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public boolean updatePosition(Integer positionId, JobPosition jobPosition, String userId) {
        JobPosition existing = jobPositionMapper.selectById(positionId);
        if (existing == null) {
            throw new BusinessException("职位不存在");
        }
        if (!userId.equals(existing.getUserId())) {
            throw new BusinessException("无权修改此职位");
        }
        // 只更新业务字段，保护 viewCount / status / publishedAt / createdAt 不被覆盖
        existing.setJobName(jobPosition.getJobName());
        existing.setSalaryMin(jobPosition.getSalaryMin());
        existing.setSalaryMax(jobPosition.getSalaryMax());
        existing.setWorkLocation(jobPosition.getWorkLocation());
        existing.setExperience(jobPosition.getExperience());
        existing.setEducation(jobPosition.getEducation());
        existing.setRecruitCount(jobPosition.getRecruitCount());
        existing.setJobDescription(jobPosition.getJobDescription());
        existing.setSkills(jobPosition.getSkills());
        existing.setJobCategory(jobPosition.getJobCategory());
        existing.setUpdatedAt(LocalDateTime.now());
        return jobPositionMapper.update(existing) > 0;
    }

    @Override
    public boolean deletePosition(Integer id, String userId) {
        JobPosition existing = jobPositionMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("职位不存在");
        }
        if (!userId.equals(existing.getUserId())) {
            throw new BusinessException("无权删除此职位");
        }
        return jobPositionMapper.deleteById(id) > 0;
    }

    @Override
    public void incrementViewCount(Integer id) {
        jobPositionMapper.incrementViewCount(id);
    }
}
