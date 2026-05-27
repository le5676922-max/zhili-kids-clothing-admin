package com.example.java.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 后台管理系统 - 用户分页结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserPageResult implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<AdminUserVO> list;
    private long total;
}
