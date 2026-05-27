package com.example.java.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 产品搜索请求DTO
 */
@Data
public class ProductSearchRequest {
    private String keyword;          // 关键词（名称/描述）
    private String category;          // 产品分类
    private String ageRange;         // 适用年龄
    private String season;           // 适用季节
    private String material;         // 材质
    private String certification;     // 认证
    private String badge;            // 标签
    private BigDecimal minPrice;      // 最低价格
    private BigDecimal maxPrice;      // 最高价格
    private String sortBy;           // 排序字段：sales, price, created_at
    private String sortOrder;        // 排序方向：asc, desc
    private Integer page;            // 页码
    private Integer pageSize;        // 每页数量
    private Integer offset;          // 偏移量（计算得出）
}
