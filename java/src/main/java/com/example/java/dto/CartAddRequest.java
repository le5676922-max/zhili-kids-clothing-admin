package com.example.java.dto;

import lombok.Data;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * 加入购物车请求
 */
@Data
public class CartAddRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "产品ID不能为空")
    private String productId;
    private String selectedColor;
    private String selectedSize;
    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量至少为1")
    private Integer quantity;
}
