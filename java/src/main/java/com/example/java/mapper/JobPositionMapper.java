package com.example.java.mapper;

import com.example.java.entity.JobPosition;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 招聘职位 Mapper
 */
@Mapper
public interface JobPositionMapper {

    /**
     * 查询所有招聘中的职位列表（含企业信息）
     */
    List<JobPosition> findAll();

    /**
     * 搜索/筛选职位列表
     */
    List<JobPosition> search(@Param("keyword") String keyword,
                             @Param("category") String category,
                             @Param("experience") String experience,
                             @Param("education") String education,
                             @Param("salary") String salary);

    /**
     * 根据ID查询职位详情
     */
    JobPosition selectById(@Param("id") Integer id);

    /**
     * 根据用户ID查询职位列表
     */
    List<JobPosition> findByUserId(@Param("userId") String userId);

    /**
     * 新增职位
     */
    int insert(JobPosition jobPosition);

    /**
     * 更新职位
     */
    int update(JobPosition jobPosition);

    /**
     * 删除职位
     */
    int deleteById(@Param("id") Integer id);

    /**
     * 增加浏览次数
     */
    int incrementViewCount(@Param("id") Integer id);
}
