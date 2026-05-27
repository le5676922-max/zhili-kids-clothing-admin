package com.example.java.service;

import com.example.java.entity.User;

import java.util.List;

public interface EnterpriseFollowService {

    /**
     * 关注企业
     * @param userId 关注者用户ID
     * @param enterpriseId 被关注企业ID
     */
    void follow(String userId, String enterpriseId);

    /**
     * 取消关注
     * @param userId 关注者用户ID
     * @param enterpriseId 被关注企业ID
     */
    void unfollow(String userId, String enterpriseId);

    /**
     * 检查是否已关注
     * @param userId 关注者用户ID
     * @param enterpriseId 被关注企业ID
     * @return true=已关注
     */
    boolean isFollowing(String userId, String enterpriseId);

    /**
     * 获取用户的关注列表
     * @param userId 用户ID
     * @return 关注的企业列表
     */
    List<User> getFollowingList(String userId);

    /**
     * 获取企业的粉丝列表
     * @param enterpriseId 企业用户ID
     * @return 粉丝用户列表
     */
    List<String> getFollowerIds(String enterpriseId);

    /**
     * 获取企业的粉丝数量
     * @param enterpriseId 企业用户ID
     * @return 粉丝数量
     */
    int getFollowerCount(String enterpriseId);
}
