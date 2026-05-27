package com.example.java.service;

import com.example.java.dto.ProductCreateOrUpdateRequest;
import com.example.java.dto.ProductVO;

import java.util.List;

/**
 * 产品服务
 */
public interface ProductService {

    /**
     * 获取产品展示列表（上架且含企业名称）
     */
    List<ProductVO> listForDisplay();

    /**
     * 获取当前用户发布的产品列表（含上架与下架）
     */
    List<ProductVO> listByUserId(String userId);

    /**
     * 根据ID获取产品（用于校验归属）
     */
    ProductVO getById(String id);

    /**
     * 创建商品（商家上架）
     */
    ProductVO create(ProductCreateOrUpdateRequest request, String userId);

    /**
     * 更新商品信息与价格
     */
    void update(String productId, ProductCreateOrUpdateRequest request, String userId);

    /**
     * 上架/下架商品
     */
    void updateStatus(String productId, Integer status, String userId);

    /**
     * 管理端：分页查询全部商品
     */
    com.example.java.dto.admin.AdminProductPageResult listForAdmin(int page, int pageSize);

    /**
     * 管理端：下架/上架商品（不校验归属）
     */
    void adminUpdateStatus(String productId, Integer status);
}
