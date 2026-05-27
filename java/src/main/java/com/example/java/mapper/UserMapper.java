package com.example.java.mapper;

import com.example.java.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户Mapper接口，对应表 users
 */
@Mapper
public interface UserMapper {

    /** 根据邮箱查询用户 */
    User findByEmail(@Param("email") String email);

    /** 根据ID查询用户 */
    User findById(@Param("id") String id);

    /** 插入用户 */
    int insert(User user);

    /** 更新用户 */
    int update(User user);

    /** 根据ID删除用户 */
    int deleteById(@Param("id") String id);

    /** 统计邮箱数量 */
    int countByEmail(@Param("email") String email);

    /** 后台管理：分页查询用户列表（支持搜索、类型、企业状态筛选） */
    List<User> findPageForAdmin(@Param("search") String search,
                               @Param("userType") Integer userType,
                               @Param("enterpriseStatus") Integer enterpriseStatus,
                               @Param("offset") long offset,
                               @Param("pageSize") int pageSize);

    /** 后台管理：统计符合条件的用户总数 */
    long countForAdmin(@Param("search") String search,
                      @Param("userType") Integer userType,
                      @Param("enterpriseStatus") Integer enterpriseStatus);

    /** 企业展示：查询已通过审核的企业用户列表（user_type=2, enterprise_status=1） */
    List<User> findEnterpriseList();
}
