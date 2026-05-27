package com.example.java.service.impl;

import com.example.java.dto.ProductCreateOrUpdateRequest;
import com.example.java.dto.ProductVO;
import com.example.java.dto.admin.AdminProductPageResult;
import com.example.java.entity.Product;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.ProductMapper;
import com.example.java.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * 产品服务实现
 */
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;

    private static final int STATUS_OFF = 0;
    private static final int STATUS_ON = 1;

    @Override
    public List<ProductVO> listForDisplay() {
        return productMapper.findListForDisplay();
    }

    @Override
    public List<ProductVO> listByUserId(String userId) {
        return productMapper.findByUserId(userId);
    }

    @Override
    public ProductVO getById(String id) {
        return productMapper.selectById(id);
    }

    @Override
    public ProductVO create(ProductCreateOrUpdateRequest request, String userId) {
        Product product = toEntity(request);
        product.setId("P" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        product.setUserId(userId);
        product.setSales(0);
        product.setStatus(STATUS_ON);
        productMapper.insert(product);
        return productMapper.selectById(product.getId());
    }

    @Override
    public void update(String productId, ProductCreateOrUpdateRequest request, String userId) {
        ProductVO vo = productMapper.selectById(productId);
        if (vo == null) {
            throw new BusinessException("商品不存在");
        }
        if (!userId.equals(vo.getUserId())) {
            throw new BusinessException("无权修改该商品");
        }
        Product product = toEntity(request);
        product.setId(productId);
        // 库存只能通过出入库流程修改，此处不更新 stock 字段
        product.setStock(null);
        productMapper.update(product);
    }

    @Override
    public void updateStatus(String productId, Integer status, String userId) {
        if (status != null && status != STATUS_OFF && status != STATUS_ON) {
            throw new BusinessException("状态只能为 0(下架) 或 1(上架)");
        }
        ProductVO vo = productMapper.selectById(productId);
        if (vo == null) {
            throw new BusinessException("商品不存在");
        }
        if (!userId.equals(vo.getUserId())) {
            throw new BusinessException("无权操作该商品");
        }
        productMapper.updateStatus(productId, status);
    }

    @Override
    public AdminProductPageResult listForAdmin(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = productMapper.countForAdmin();
        java.util.List<ProductVO> list = productMapper.findListForAdmin(offset, limit);
        return new AdminProductPageResult(list, total);
    }

    @Override
    public void adminUpdateStatus(String productId, Integer status) {
        if (status != null && status != STATUS_OFF && status != STATUS_ON) {
            throw new BusinessException("状态只能为 0(下架) 或 1(上架)");
        }
        ProductVO vo = productMapper.selectById(productId);
        if (vo == null) {
            throw new BusinessException("商品不存在");
        }
        productMapper.updateStatus(productId, status);
    }

    private Product toEntity(ProductCreateOrUpdateRequest request) {
        Product p = new Product();
        p.setName(request.getName());
        p.setDescription(request.getDescription());
        p.setCategory(request.getCategory());
        p.setAgeRange(request.getAgeRange());
        p.setSeason(request.getSeason());
        p.setMaterial(request.getMaterial());
        p.setCertification(request.getCertification());
        p.setPrice(request.getPrice());
        p.setOriginalPrice(request.getOriginalPrice());
        p.setBadge(request.getBadge());
        p.setImageUrl(request.getImageUrl());
        p.setStock(request.getStock() != null && request.getStock() >= 0 ? request.getStock() : 0);
        return p;
    }
}
