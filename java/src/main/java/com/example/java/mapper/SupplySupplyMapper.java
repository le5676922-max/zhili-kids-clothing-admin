package com.example.java.mapper;

import com.example.java.dto.SupplySupplyVO;
import com.example.java.entity.SupplySupply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 供应信息 Mapper
 */
@Mapper
public interface SupplySupplyMapper {

    /**
     * 查询所有供应列表（含企业信息）
     */
    List<SupplySupplyVO> findAll();

    /**
     * 搜索/筛选供应列表
     */
    List<SupplySupplyVO> search(@Param("keyword") String keyword,
                                @Param("type") String type,
                                @Param("status") String status);

    /**
     * 根据ID查询供应详情
     */
    SupplySupplyVO selectById(Integer id);

    /**
     * 根据用户ID查询供应列表
     */
    List<SupplySupplyVO> findByUserId(String userId);

    /**
     * 新增供应
     */
    int insert(SupplySupply supply);

    /**
     * 更新供应
     */
    int update(SupplySupply supply);

    /**
     * 删除供应
     */
    int deleteById(Integer id);

    /**
     * 增加浏览次数
     */
    int incrementViewCount(Integer id);

    /**
     * 更新供应状态
     */
    int updateStatus(@Param("id") Integer id, @Param("status") String status);

    /**
     * 管理端：供应信息分页查询
     */
    List<SupplySupplyVO> findListForAdmin(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 管理端：供应信息总数
     */
    int countForAdmin();
}
