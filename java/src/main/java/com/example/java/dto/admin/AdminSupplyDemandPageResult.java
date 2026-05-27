package com.example.java.dto.admin;

import com.example.java.dto.SupplyDemandVO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 后台管理系统 - 需求信息分页结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSupplyDemandPageResult implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<SupplyDemandVO> list;
    private long total;
}
