package com.example.java.dto.admin;

import com.example.java.dto.SupplyConnectionVO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 后台管理系统 - 对接记录分页结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSupplyConnectionPageResult implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<SupplyConnectionVO> list;
    private long total;
}
