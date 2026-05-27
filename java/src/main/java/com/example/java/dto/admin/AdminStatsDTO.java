package com.example.java.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 后台管理系统 - 仪表盘统计
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 总用户数 */
    private long totalUsers;
    /** 个人用户数 */
    private long personalUsers;
    /** 企业用户数 */
    private long enterpriseUsers;
    /** 待审核企业数 */
    private long pendingEnterprises;
    /** 已拒绝企业数 */
    private long rejectedEnterprises;
}
