package com.example.java.mapper;

import com.example.java.entity.EnterpriseFollow;
import lombok.Data;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface EnterpriseFollowMapper {

    /**
     * 检查是否已关注
     */
    @Select("SELECT COUNT(*) FROM enterprise_follows WHERE user_id = #{userId} AND enterprise_id = #{enterpriseId}")
    int countByUserAndEnterprise(@Param("userId") String userId, @Param("enterpriseId") String enterpriseId);

    /**
     * 关注企业
     */
    @Insert("INSERT INTO enterprise_follows (user_id, enterprise_id) VALUES (#{userId}, #{enterpriseId})")
    int insert(@Param("userId") String userId, @Param("enterpriseId") String enterpriseId);

    /**
     * 取消关注
     */
    @Delete("DELETE FROM enterprise_follows WHERE user_id = #{userId} AND enterprise_id = #{enterpriseId}")
    int delete(@Param("userId") String userId, @Param("enterpriseId") String enterpriseId);

    /**
     * 获取用户的关注列表
     */
    @Select("SELECT f.id, f.user_id, f.enterprise_id, f.created_at, " +
            "u.nickname, u.avatar, u.enterprise_name, u.enterprise_introduction, " +
            "u.enterprise_tags, u.enterprise_certifications " +
            "FROM enterprise_follows f " +
            "LEFT JOIN users u ON f.enterprise_id = u.id " +
            "WHERE f.user_id = #{userId} " +
            "ORDER BY f.created_at DESC")
    List<EnterpriseFollowVO> selectByUserId(@Param("userId") String userId);

    /**
     * 获取企业的粉丝列表
     */
    @Select("SELECT f.id, f.user_id, f.enterprise_id, f.created_at, " +
            "u.nickname, u.avatar " +
            "FROM enterprise_follows f " +
            "LEFT JOIN users u ON f.user_id = u.id " +
            "WHERE f.enterprise_id = #{enterpriseId} " +
            "ORDER BY f.created_at DESC")
    List<EnterpriseFollowVO> selectByEnterpriseId(@Param("enterpriseId") String enterpriseId);

    /**
     * 获取企业的粉丝数量
     */
    @Select("SELECT COUNT(*) FROM enterprise_follows WHERE enterprise_id = #{enterpriseId}")
    int countByEnterpriseId(@Param("enterpriseId") String enterpriseId);

    /**
     * 企业关注VO
     */
    @Data
    class EnterpriseFollowVO {
        private Integer id;
        private String userId;
        private String enterpriseId;
        private String createdAt;
        private String nickname;
        private String avatar;
        private String enterpriseName;
        private String enterpriseIntroduction;
        private String enterpriseTags;
        private String enterpriseCertifications;
    }
}
