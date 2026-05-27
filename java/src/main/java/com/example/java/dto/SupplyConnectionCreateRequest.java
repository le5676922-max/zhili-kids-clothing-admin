package com.example.java.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * 创建对接请求DTO
 */
@Data
public class SupplyConnectionCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 需求ID（需求方发起对接时填写） */
    private Integer demandId;

    /** 供应ID（供应方发起对接时填写） */
    private Integer supplyId;

    /** 对接说明 */
    private String notes;
}
