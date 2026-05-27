package com.example.java.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 联系人列表项（信息界面左侧） */
@Data
public class ChatContactVO {
    private String otherUserId;
    private String otherNickname;
    private String otherAvatar;
    private Integer jobId;
    private String jobName;
    /** 供需对接ID（非空表示该联系人是企业间供需对接场景） */
    private Integer connectionId;
    /** 对接编号，如 CN20240101001 */
    private String connectionCode;
    /** 对接关联的需求/供应标题 */
    private String connectionTitle;
    private String lastContent;
    private LocalDateTime lastTime;
    /** 与该联系人的未读消息数 */
    private Integer unreadCount;
}
