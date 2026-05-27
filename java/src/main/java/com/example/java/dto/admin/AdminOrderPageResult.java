package com.example.java.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 后台管理系统 - 订单分页结果（按订单项展开）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderPageResult implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<AdminOrderRowDTO> list;
    private long total;
}
