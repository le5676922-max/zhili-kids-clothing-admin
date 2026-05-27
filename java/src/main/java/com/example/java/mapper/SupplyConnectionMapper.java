package com.example.java.mapper;

import com.example.java.dto.SupplyConnectionVO;
import com.example.java.entity.SupplyConnection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 供需对接记录 Mapper
 */
@Mapper
public interface SupplyConnectionMapper {

    /**
     * 新增对接记录
     */
    int insert(SupplyConnection connection);

    /**
     * 根据ID查询对接记录
     */
    SupplyConnectionVO selectById(Integer id);

    /**
     * 根据需求ID查询所有对接记录
     */
    List<SupplyConnectionVO> findByDemandId(@Param("demandId") Integer demandId);

    /**
     * 根据供应ID查询所有对接记录
     */
    List<SupplyConnectionVO> findBySupplyId(@Param("supplyId") Integer supplyId);

    /**
     * 根据用户ID查询该用户发起的所有对接记录
     */
    List<SupplyConnectionVO> findByApplicantUserId(@Param("userId") String userId);

    /**
     * 查询用户作为需求方或供应方的所有对接记录
     */
    List<SupplyConnectionVO> findByUserId(@Param("userId") String userId);

    /**
     * 检查需求和供应是否已存在对接记录（状态为洽谈中）
     */
    int countByDemandAndSupply(@Param("demandId") Integer demandId, @Param("supplyId") Integer supplyId);

    /**
     * 更新对接状态
     */
    int updateStatus(@Param("id") Integer id, @Param("status") String status);

    /**
     * 更新对接记录
     */
    int update(SupplyConnection connection);

    /**
     * 删除对接记录
     */
    int deleteById(Integer id);

    /**
     * 管理端：对接记录分页查询
     */
    List<SupplyConnectionVO> findListForAdmin(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 管理端：对接记录总数
     */
    int countForAdmin();
}
