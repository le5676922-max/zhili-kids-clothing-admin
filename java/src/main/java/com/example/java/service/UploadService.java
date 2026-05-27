package com.example.java.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传服务接口
 */
public interface UploadService {

    /**
     * 上传头像图片
     * @param file 上传的文件
     * @return 上传后的公网 URL
     */
    String uploadAvatar(MultipartFile file);

    /**
     * 上传营业执照
     * @param file 上传的文件（图片或 PDF）
     * @return 上传后的公网 URL
     */
    String uploadLicense(MultipartFile file);

    /**
     * 上传商品主图到 OSS（bucket：zhili-kids-industry-system，目录 products/）
     * @param file 图片文件
     * @return 上传后的公网 URL，写入商品 image_url
     */
    String uploadProductImage(MultipartFile file);

    /**
     * 上传简历图片到 OSS（bucket：zhili-kids-industry-system，目录 jianli/）
     * @param file 图片文件
     * @return 上传后的公网 URL
     */
    String uploadResumeImage(MultipartFile file);

    /**
     * 上传供应链附件文档到 OSS（bucket：zhili-kids-industry-system，目录 fujian/）
     * 支持图片、PDF、Excel等格式
     * @param file 附件文件
     * @return 上传后的公网 URL
     */
    String uploadSupplyAttachment(MultipartFile file);
}
