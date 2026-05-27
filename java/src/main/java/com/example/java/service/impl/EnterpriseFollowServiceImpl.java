package com.example.java.service.impl;

import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.EnterpriseFollowMapper;
import com.example.java.mapper.UserMapper;
import com.example.java.service.EnterpriseFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnterpriseFollowServiceImpl implements EnterpriseFollowService {

    private final EnterpriseFollowMapper followMapper;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public void follow(String userId, String enterpriseId) {
        // 不能关注自己
        if (userId.equals(enterpriseId)) {
            throw new BusinessException("不能关注自己");
        }

        // 检查企业是否存在且为企业用户
        User enterprise = userMapper.findById(enterpriseId);
        if (enterprise == null) {
            throw new BusinessException("企业不存在");
        }
        if (enterprise.getUserType() == null || enterprise.getUserType() != 2) {
            throw new BusinessException("只能关注企业用户");
        }
        if (!Integer.valueOf(1).equals(enterprise.getEnterpriseStatus())) {
            throw new BusinessException("只能关注已通过审核的企业");
        }

        // 检查是否已关注
        if (followMapper.countByUserAndEnterprise(userId, enterpriseId) > 0) {
            throw new BusinessException("已经关注过该企业");
        }

        followMapper.insert(userId, enterpriseId);
    }

    @Override
    @Transactional
    public void unfollow(String userId, String enterpriseId) {
        // 检查是否已关注
        if (followMapper.countByUserAndEnterprise(userId, enterpriseId) <= 0) {
            throw new BusinessException("未关注该企业");
        }

        followMapper.delete(userId, enterpriseId);
    }

    @Override
    public boolean isFollowing(String userId, String enterpriseId) {
        return followMapper.countByUserAndEnterprise(userId, enterpriseId) > 0;
    }

    @Override
    public List<User> getFollowingList(String userId) {
        List<EnterpriseFollowMapper.EnterpriseFollowVO> voList = followMapper.selectByUserId(userId);
        if (voList == null || voList.isEmpty()) {
            return new ArrayList<>();
        }

        return voList.stream()
                .map(vo -> {
                    User user = new User();
                    user.setId(vo.getEnterpriseId());
                    user.setNickname(vo.getNickname());
                    user.setAvatar(vo.getAvatar());
                    user.setEnterpriseName(vo.getEnterpriseName());
                    user.setEnterpriseIntroduction(vo.getEnterpriseIntroduction());
                    user.setEnterpriseTags(vo.getEnterpriseTags());
                    user.setEnterpriseCertifications(vo.getEnterpriseCertifications());
                    return user;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getFollowerIds(String enterpriseId) {
        List<EnterpriseFollowMapper.EnterpriseFollowVO> voList = followMapper.selectByEnterpriseId(enterpriseId);
        if (voList == null || voList.isEmpty()) {
            return new ArrayList<>();
        }
        return voList.stream()
                .map(EnterpriseFollowMapper.EnterpriseFollowVO::getUserId)
                .collect(Collectors.toList());
    }

    @Override
    public int getFollowerCount(String enterpriseId) {
        return followMapper.countByEnterpriseId(enterpriseId);
    }
}
