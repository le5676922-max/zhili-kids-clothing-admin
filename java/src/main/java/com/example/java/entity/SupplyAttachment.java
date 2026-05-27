package com.example.java.entity;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 供需附件实体，对应表 supply_attachments
 */
@Data
public class SupplyAttachment implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer id;
    private Integer demandId;
    private Integer supplyId;
    private String fileName;
    private String fileSize;
    private String fileUrl;
    private String fileType;
    private LocalDateTime createdAt;
}
