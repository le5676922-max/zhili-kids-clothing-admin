package com.example.java.mapper;

import com.example.java.dto.SupplyAttachmentVO;
import com.example.java.entity.SupplyAttachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 供需附件 Mapper
 */
@Mapper
public interface SupplyAttachmentMapper {

    /**
     * 根据主键查询附件（用于下载代理）
     */
    SupplyAttachment selectById(Integer id);

    /**
     * 根据需求ID查询附件列表
     */
    List<SupplyAttachmentVO> findByDemandId(Integer demandId);

    /**
     * 根据供应ID查询附件列表
     */
    List<SupplyAttachmentVO> findBySupplyId(Integer supplyId);

    /**
     * 新增附件
     */
    int insert(SupplyAttachment attachment);

    /**
     * 删除附件
     */
    int deleteById(Integer id);

    /**
     * 根据需求ID删除所有附件
     */
    int deleteByDemandId(Integer demandId);

    /**
     * 根据供应ID删除所有附件
     */
    int deleteBySupplyId(Integer supplyId);
}
