package com.example.java.mapper;

import com.example.java.dto.SupplyDemandVO;
import com.example.java.entity.SupplyDemand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 需求信息 Mapper
 */
@Mapper
public interface SupplyDemandMapper {

    /**
     * 查询所有需求列表（含企业信息）
     */
    List<SupplyDemandVO> findAll();

    /**
     * 搜索/筛选需求列表
     */
    List<SupplyDemandVO> search(@Param("keyword") String keyword,
                                @Param("type") String type,
                                @Param("urgency") String urgency,
                                @Param("status") String status);

    /**
     * 根据ID查询需求详情
     */
    SupplyDemandVO selectById(Integer id);

    /**
     * 根据用户ID查询需求列表
     */
    List<SupplyDemandVO> findByUserId(String userId);

    /**
     * 新增需求
     */
    int insert(SupplyDemand demand);

    /**
     * 更新需求
     */
    int update(SupplyDemand demand);

    /**
     * 删除需求
     */
    int deleteById(Integer id);

    /**
     * 增加浏览次数
     */
    int incrementViewCount(Integer id);

    /**
     * 更新需求状态
     */
    int updateStatus(@Param("id") Integer id, @Param("status") String status);

    /**
     * 管理端：需求信息分页查询
     */
    List<SupplyDemandVO> findListForAdmin(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 管理端：需求信息总数
     */
    int countForAdmin();
}
