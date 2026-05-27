package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.ProductPageResult;
import com.example.java.dto.ProductSearchRequest;
import com.example.java.dto.ProductVO;
import com.example.java.service.ProductReviewService;
import com.example.java.service.ProductSearchService;
import com.example.java.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 产品展示接口（公开，无需登录）
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductSearchService productSearchService;
    private final ProductReviewService productReviewService;

    /**
     * 获取产品列表（供产品展示页使用，图片 URL 来自数据库）
     */
    @GetMapping("/products")
    public R<List<ProductVO>> list() {
        List<ProductVO> list = productService.listForDisplay();
        return R.success(list);
    }

    /**
     * 搜索产品（多条件筛选）
     * 支持参数：
     * - keyword: 关键词（名称/描述/分类）
     * - category: 产品分类
     * - ageRange: 适用年龄
     * - season: 适用季节
     * - material: 材质
     * - certification: 认证
     * - badge: 标签
     * - minPrice: 最低价格
     * - maxPrice: 最高价格
     * - sortBy: 排序字段（sales/price/created_at）
     * - sortOrder: 排序方向（asc/desc）
     * - page: 页码（默认1）
     * - pageSize: 每页数量（默认20）
     */
    @GetMapping("/products/search")
    public R<ProductPageResult> search(ProductSearchRequest request) {
        ProductPageResult result = productSearchService.searchProducts(request);
        return R.success(result);
    }

    /**
     * 获取热门产品
     * @param limit 数量限制，默认10
     */
    @GetMapping("/products/hot")
    public R<List<ProductVO>> hotProducts(@RequestParam(defaultValue = "10") int limit) {
        List<ProductVO> list = productSearchService.getHotProducts(limit);
        return R.success(list);
    }

    /**
     * 获取新品
     * @param limit 数量限制，默认10
     */
    @GetMapping("/products/new")
    public R<List<ProductVO>> newProducts(@RequestParam(defaultValue = "10") int limit) {
        List<ProductVO> list = productSearchService.getNewProducts(limit);
        return R.success(list);
    }

    /**
     * 获取商品评分和评价数量（公开接口）
     */
    @GetMapping("/products/{id}/reviews/summary")
    public R<Map<String, Object>> getProductReviewSummary(@PathVariable String id) {
        double averageRating = productReviewService.getAverageRating(id);
        int reviewCount = productReviewService.getReviewCount(id);
        Map<String, Object> result = new HashMap<>();
        result.put("averageRating", Math.round(averageRating * 10) / 10.0);
        result.put("reviewCount", reviewCount);
        return R.success(result);
    }

    /**
     * 获取产品详情（含库存信息，供产品预览弹窗使用）
     */
    @GetMapping("/products/{id}")
    public R<ProductVO> getProductDetail(@PathVariable String id) {
        ProductVO product = productService.getById(id);
        if (product == null) {
            return R.fail("商品不存在");
        }
        return R.success(product);
    }
}
