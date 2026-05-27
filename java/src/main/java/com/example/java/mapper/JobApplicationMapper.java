package com.example.java.mapper;

import com.example.java.dto.JobApplicationVO;
import com.example.java.dto.MyJobApplicationVO;
import com.example.java.entity.JobApplication;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 职位申请 Mapper
 */
@Mapper
public interface JobApplicationMapper {

    int insert(JobApplication application);

    JobApplication selectByUserIdAndJobId(@Param("userId") String userId, @Param("jobId") Integer jobId);

    /**
     * 根据ID查询申请记录
     */
    JobApplicationVO selectById(@Param("id") Integer id);

    /**
     * 更新申请状态
     */
    int updateStatus(@Param("id") Integer id, @Param("status") Integer status);

    /**
     * 企业端：查询投递到本企业职位下的所有申请
     */
    List<JobApplicationVO> selectReceivedByEnterpriseUserId(@Param("enterpriseUserId") String enterpriseUserId);

    /**
     * 个人端：当前用户投递过的职位申请
     */
    List<MyJobApplicationVO> selectByApplicantUserId(@Param("userId") String userId);
}
