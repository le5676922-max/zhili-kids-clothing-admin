package com.example.java.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 附件VO
 */
@Data
public class SupplyAttachmentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private String fileName;
    private String fileSize;
    private String fileUrl;
    private String fileType;
}
