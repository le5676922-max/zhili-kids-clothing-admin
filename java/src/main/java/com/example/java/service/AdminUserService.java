package com.example.java.service;

import com.example.java.dto.admin.AdminStatsDTO;
import com.example.java.dto.admin.AdminUserPageResult;
import com.example.java.dto.admin.AdminUserVO;

/**
 * 后台管理系统 - 用户管理服务（与业务端 /api/auth 分离）
 */
public interface AdminUserService {

    /**
     * 仪表盘统计
     */
    AdminStatsDTO getStats();

    /**
     * 分页查询用户列表（支持搜索、类型、企业状态筛选）
     */
    AdminUserPageResult getUsersPage(int page, int pageSize,
                                    String search, Integer userType, Integer enterpriseStatus);

    /**
     * 获取用户详情（用于审核弹窗等）
     */
    AdminUserVO getUserDetail(String userId);
}
