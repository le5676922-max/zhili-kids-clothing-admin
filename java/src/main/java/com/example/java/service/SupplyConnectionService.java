package com.example.java.service;

import com.example.java.dto.MyPublishedItemVO;
import com.example.java.dto.SupplyConnectionCreateRequest;
import com.example.java.dto.SupplyConnectionVO;
import com.example.java.entity.User;

import java.util.List;

/**
 * 供需对接服务接口
 */
public interface SupplyConnectionService {

    /**
     * 创建对接记录
     * @param request 创建对接请求
     * @param user    当前登录企业用户
     * @return 对接记录ID
     */
    Integer createConnection(SupplyConnectionCreateRequest request, User user);

    /**
     * 根据ID获取对接记录详情
     */
    SupplyConnectionVO getConnectionById(Integer id);

    /**
     * 根据需求ID获取所有对接记录
     */
    List<SupplyConnectionVO> getConnectionsByDemandId(Integer demandId);

    /**
     * 根据供应ID获取所有对接记录
     */
    List<SupplyConnectionVO> getConnectionsBySupplyId(Integer supplyId);

    /**
     * 获取当前用户相关的所有对接记录
     */
    List<SupplyConnectionVO> getMyConnections(String userId);

    /**
     * 获取我发布的供需列表（含对接状态和合作方信息）
     */
    List<MyPublishedItemVO> getMyPublishedItems(String userId);

    /**
     * 更新对接状态
     * @param id 对接记录ID
     * @param status 新状态
     * @param userId 当前用户ID（校验权限）
     * @return 是否成功
     */
    boolean updateConnectionStatus(Integer id, String status, String userId);

    /**
     * 删除对接记录
     * @param id 对接记录ID
     * @param userId 当前用户ID（校验权限）
     * @return 是否成功
     */
    boolean deleteConnection(Integer id, String userId);
}
