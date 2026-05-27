package com.example.java.service;

import com.example.java.dto.SupplySupplyCreateRequest;
import com.example.java.dto.SupplySupplyVO;

import java.util.List;

/**
 * 供应信息服务接口
 */
public interface SupplySupplyService {

    /**
     * 获取所有供应列表
     */
    List<SupplySupplyVO> getAllSupplies();

    /**
     * 搜索/筛选供应列表
     */
    List<SupplySupplyVO> searchSupplies(String keyword, String type, String status);

    /**
     * 根据ID获取供应详情（包含附件）
     */
    SupplySupplyVO getSupplyById(Integer id);

    /**
     * 根据用户ID获取供应列表
     */
    List<SupplySupplyVO> getSuppliesByUserId(String userId);

    /**
     * 发布供应
     */
    boolean publishSupply(SupplySupplyCreateRequest request, String userId);

    /**
     * 更新供应
     */
    boolean updateSupply(Integer id, SupplySupplyCreateRequest request);

    /**
     * 删除供应
     */
    boolean deleteSupply(Integer id);
}
