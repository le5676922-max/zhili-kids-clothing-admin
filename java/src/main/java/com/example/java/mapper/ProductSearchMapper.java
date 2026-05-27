package com.example.java.mapper;

import com.example.java.dto.ProductSearchRequest;
import com.example.java.dto.ProductVO;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface ProductSearchMapper {

    /**
     * 搜索产品列表
     */
    List<ProductVO> searchProducts(@Param("request") ProductSearchRequest request);

    /**
     * 统计搜索结果数量
     */
    long countSearchProducts(@Param("request") ProductSearchRequest request);

    /**
     * 获取热门产品（销量最高）
     */
    List<ProductVO> findHotProducts(@Param("limit") int limit);

    /**
     * 获取新品（最新上架）
     */
    List<ProductVO> findNewProducts(@Param("limit") int limit);
}
