package com.example.java.service.impl;

import com.example.java.dto.ProductPageResult;
import com.example.java.dto.ProductSearchRequest;
import com.example.java.dto.ProductVO;
import com.example.java.mapper.ProductSearchMapper;
import com.example.java.service.ProductSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductSearchServiceImpl implements ProductSearchService {

    private final ProductSearchMapper searchMapper;

    @Override
    public ProductPageResult searchProducts(ProductSearchRequest request) {
        // 使用局部变量，避免污染调用方的入参对象
        int page = (request.getPage() != null && request.getPage() >= 1) ? request.getPage() : 1;
        int pageSize = (request.getPageSize() != null && request.getPageSize() >= 1) ? request.getPageSize() : 20;
        if (pageSize > 100) pageSize = 100;
        int offset = (page - 1) * pageSize;
        String sortBy = (request.getSortBy() != null && !request.getSortBy().isEmpty()) ? request.getSortBy() : "sales";
        String sortOrder = (request.getSortOrder() != null && !request.getSortOrder().isEmpty()) ? request.getSortOrder() : "desc";

        request.setPage(page);
        request.setPageSize(pageSize);
        request.setOffset(offset);
        request.setSortBy(sortBy);
        request.setSortOrder(sortOrder);

        // 查询列表和总数
        List<ProductVO> list = searchMapper.searchProducts(request);
        long total = searchMapper.countSearchProducts(request);

        return new ProductPageResult(list, total, page, pageSize);
    }

    @Override
    public List<ProductVO> getHotProducts(int limit) {
        if (limit <= 0) limit = 10;
        if (limit > 50) limit = 50;
        return searchMapper.findHotProducts(limit);
    }

    @Override
    public List<ProductVO> getNewProducts(int limit) {
        if (limit <= 0) limit = 10;
        if (limit > 50) limit = 50;
        return searchMapper.findNewProducts(limit);
    }
}
