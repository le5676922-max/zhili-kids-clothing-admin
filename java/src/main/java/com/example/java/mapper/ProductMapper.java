package com.example.java.mapper;

import com.example.java.dto.ProductVO;
import com.example.java.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 产品 Mapper
 */
@Mapper
public interface ProductMapper {

    /**
     * 查询上架产品列表（含企业名称），供产品展示页使用
     */
    List<ProductVO> findListForDisplay();

    /**
     * 根据ID查询产品
     */
    ProductVO selectById(String id);

    /**
     * 根据用户ID查询产品列表
     */
    List<ProductVO> findByUserId(String userId);

    /**
     * 管理端：全部商品分页
     */
    List<ProductVO> findListForAdmin(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 管理端：商品总数
     */
    int countForAdmin();

    /**
     * 新增产品
     */
    int insert(Product product);

    /**
     * 更新产品信息（不含 status、sales、user_id）
     */
    int update(Product product);

    /**
     * 更新产品上架/下架状态
     */
    int updateStatus(@Param("id") String id, @Param("status") Integer status);

    /**
     * 扣减库存（订单支付成功后调用）
     * @return 影响行数，stock不足时返回0
     */
    int decrementStock(@Param("productId") String productId, @Param("quantity") int quantity);

    /**
     * 恢复库存（订单取消时调用）
     */
    int restoreStock(@Param("productId") String productId, @Param("quantity") int quantity);
}
