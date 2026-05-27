package com.example.java.service.impl;

import com.example.java.dto.admin.AdminStatsDTO;
import com.example.java.dto.admin.AdminUserPageResult;
import com.example.java.dto.admin.AdminUserVO;
import com.example.java.entity.User;
import com.example.java.mapper.UserMapper;
import com.example.java.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 后台管理系统 - 用户管理服务实现（仅服务 /api/admin 接口）
 */
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserMapper userMapper;

    @Override
    public AdminStatsDTO getStats() {
        long total = userMapper.countForAdmin(null, null, null);
        long personal = userMapper.countForAdmin(null, 1, null);
        long enterprise = userMapper.countForAdmin(null, 2, null);
        long pending = userMapper.countForAdmin(null, 2, 0);
        long rejected = userMapper.countForAdmin(null, 2, 2);
        return new AdminStatsDTO(total, personal, enterprise, pending, rejected);
    }

    @Override
    public AdminUserPageResult getUsersPage(int page, int pageSize,
                                           String search, Integer userType, Integer enterpriseStatus) {
        long offset = (long) (page - 1) * pageSize;
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        List<User> list = userMapper.findPageForAdmin(
                searchParam, userType, enterpriseStatus, offset, pageSize);
        long total = userMapper.countForAdmin(searchParam, userType, enterpriseStatus);
        List<AdminUserVO> voList = list.stream().map(this::toAdminUserVO).collect(Collectors.toList());
        return new AdminUserPageResult(voList, total);
    }

    @Override
    public AdminUserVO getUserDetail(String userId) {
        User user = userMapper.findById(userId);
        return user == null ? null : toAdminUserVO(user);
    }

    private AdminUserVO toAdminUserVO(User u) {
        AdminUserVO vo = new AdminUserVO();
        vo.setId(u.getId());
        vo.setEmail(u.getEmail());
        vo.setNickname(u.getNickname());
        vo.setAvatar(u.getAvatar());
        vo.setUserType(u.getUserType());
        vo.setEnterpriseStatus(u.getEnterpriseStatus());
        vo.setEnterpriseName(u.getEnterpriseName());
        vo.setEnterpriseLicense(u.getEnterpriseLicense());
        vo.setLicenseImageUrl(u.getLicenseImageUrl());
        vo.setCreatedAt(u.getCreatedAt());
        return vo;
    }
}
