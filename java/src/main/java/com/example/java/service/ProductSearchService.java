package com.example.java.service;

import com.example.java.dto.ProductPageResult;
import com.example.java.dto.ProductSearchRequest;
import com.example.java.dto.ProductVO;

import java.util.List;

public interface ProductSearchService {

    /**
     * 搜索产品
     * @param request 搜索条件
     * @return 分页结果
     */
    ProductPageResult searchProducts(ProductSearchRequest request);

    /**
     * 获取热门产品
     * @param limit 数量限制
     * @return 热门产品列表
     */
    List<ProductVO> getHotProducts(int limit);

    /**
     * 获取新品
     * @param limit 数量限制
     * @return 新品列表
     */
    List<ProductVO> getNewProducts(int limit);
}
