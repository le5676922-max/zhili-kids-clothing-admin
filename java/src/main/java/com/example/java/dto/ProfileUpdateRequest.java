package com.example.java.dto;

import lombok.Data;

/**
 * 更新用户资料请求DTO
 */
@Data
public class ProfileUpdateRequest {

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 头像URL
     */
    private String avatar;
}
