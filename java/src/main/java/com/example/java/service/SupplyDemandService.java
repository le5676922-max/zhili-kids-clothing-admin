package com.example.java.service;

import com.example.java.dto.SupplyDemandCreateRequest;
import com.example.java.dto.SupplyDemandVO;

import java.util.List;

/**
 * 需求信息服务接口
 */
public interface SupplyDemandService {

    /**
     * 获取所有需求列表
     */
    List<SupplyDemandVO> getAllDemands();

    /**
     * 搜索/筛选需求列表
     */
    List<SupplyDemandVO> searchDemands(String keyword, String type, String urgency, String status);

    /**
     * 根据ID获取需求详情（包含附件）
     */
    SupplyDemandVO getDemandById(Integer id);

    /**
     * 根据用户ID获取需求列表
     */
    List<SupplyDemandVO> getDemandsByUserId(String userId);

    /**
     * 发布需求
     */
    boolean publishDemand(SupplyDemandCreateRequest request, String userId);

    /**
     * 更新需求
     */
    boolean updateDemand(Integer id, SupplyDemandCreateRequest request);

    /**
     * 删除需求
     */
    boolean deleteDemand(Integer id);

    /**
     * 增加浏览次数
     */
    void incrementViewCount(Integer id);
}
