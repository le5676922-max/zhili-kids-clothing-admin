package com.example.java.dto;

import lombok.Data;
import java.util.List;

/**
 * 产品分页结果DTO
 */
@Data
public class ProductPageResult {
    private List<ProductVO> list;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;

    public ProductPageResult(List<ProductVO> list, long total, int page, int pageSize) {
        this.list = list;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) total / pageSize);
    }
}
