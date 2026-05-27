package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 产品展示用 VO（含企业名称，供前端产品展示页使用）
 */
@Data
public class ProductVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String userId;
    private String name;
    private String description;
    private String category;
    private String ageRange;
    private String season;
    private String material;
    private String certification;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer sales;
    private String badge;
    private String imageUrl;
    /** 所属企业名称（来自 users.enterprise_name） */
    private String enterpriseName;
    /** 状态：0=下架 1=上架 */
    private Integer status;
    /** 库存数量 */
    private Integer stock;
}
