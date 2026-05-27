package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 附件信息DTO（用于创建请求）
 */
@Data
public class AttachmentInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    private String fileName;
    private String fileUrl;
    private String fileSize;
    private String fileType;
}
