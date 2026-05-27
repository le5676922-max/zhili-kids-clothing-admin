package com.example.java.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 商品创建/编辑请求（商家上架、修改信息与价格）
 */
@Data
public class ProductCreateOrUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "商品名称不能为空")
    private String name;

    private String description;

    @NotBlank(message = "商品分类不能为空")
    private String category;

    private String ageRange;
    private String season;
    private String material;
    private String certification;

    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.01", message = "价格必须大于0")
    private BigDecimal price;

    private BigDecimal originalPrice;
    private String badge;
    private String imageUrl;

    /** 库存数量（仅创建时设置，编辑时不更新） */
    @PositiveOrZero(message = "库存不能为负数")
    private Integer stock;
}
