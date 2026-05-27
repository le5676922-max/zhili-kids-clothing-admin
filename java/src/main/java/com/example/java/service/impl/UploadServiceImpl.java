package com.example.java.service.impl;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.example.java.config.OssConfig;
import com.example.java.service.UploadService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * 阿里云 OSS 文件上传服务实现
 */
@Service
public class UploadServiceImpl implements UploadService {

    private final OssConfig ossConfig;
    private final OSS avatarOSSClient;
    private final OSS licenseOSSClient;

    public UploadServiceImpl(OssConfig ossConfig,
                             @Qualifier("avatarOSSClient") OSS avatarOSSClient,
                             @Qualifier("licenseOSSClient") OSS licenseOSSClient) {
        this.ossConfig = ossConfig;
        this.avatarOSSClient = avatarOSSClient;
        this.licenseOSSClient = licenseOSSClient;
    }

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
    private static final long MAX_LICENSE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    private static final String[] ALLOWED_AVATAR_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };

    private static final String[] ALLOWED_LICENSE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
            "application/pdf"
    };

    @Override
    public String uploadAvatar(MultipartFile file) {
        validateFile(file, MAX_AVATAR_SIZE, ALLOWED_AVATAR_TYPES);

        String objectName = "avatars/" + UUID.randomUUID().toString().replace("-", "")
                + getFileExtension(file.getOriginalFilename());

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            avatarOSSClient.putObject(ossConfig.getAvatarBucket(), objectName,
                    file.getInputStream(), metadata);

            // 返回永久有效的公网 URL（需在 OSS 控制台将 bucket 设为公共读）
            return "https://" + ossConfig.getAvatarBucket() + "."
                    + ossConfig.getAvatarRegion() + ".aliyuncs.com/" + objectName;
        } catch (IOException e) {
            throw new RuntimeException("头像上传失败: " + e.getMessage(), e);
        }
    }

    private static final String[] ALLOWED_PRODUCT_IMAGE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };

    @Override
    public String uploadProductImage(MultipartFile file) {
        validateFile(file, MAX_PRODUCT_IMAGE_SIZE, ALLOWED_PRODUCT_IMAGE_TYPES);

        String objectName = "products/" + UUID.randomUUID().toString().replace("-", "")
                + getFileExtension(file.getOriginalFilename());

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            avatarOSSClient.putObject(ossConfig.getAvatarBucket(), objectName,
                    file.getInputStream(), metadata);

            return "https://" + ossConfig.getAvatarBucket() + "."
                    + ossConfig.getAvatarRegion() + ".aliyuncs.com/" + objectName;
        } catch (IOException e) {
            throw new RuntimeException("商品图片上传失败: " + e.getMessage(), e);
        }
    }

    private static final long MAX_RESUME_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_RESUME_IMAGE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };

    @Override
    public String uploadResumeImage(MultipartFile file) {
        validateFile(file, MAX_RESUME_IMAGE_SIZE, ALLOWED_RESUME_IMAGE_TYPES);

        String objectName = "jianli/" + UUID.randomUUID().toString().replace("-", "")
                + getFileExtension(file.getOriginalFilename());

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            avatarOSSClient.putObject(ossConfig.getAvatarBucket(), objectName,
                    file.getInputStream(), metadata);

            return "https://" + ossConfig.getAvatarBucket() + "."
                    + ossConfig.getAvatarRegion() + ".aliyuncs.com/" + objectName;
        } catch (IOException e) {
            throw new RuntimeException("简历图片上传失败: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadLicense(MultipartFile file) {
        validateFile(file, MAX_LICENSE_SIZE, ALLOWED_LICENSE_TYPES);

        String objectName = "licenses/" + UUID.randomUUID().toString().replace("-", "")
                + getFileExtension(file.getOriginalFilename());

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            licenseOSSClient.putObject(ossConfig.getLicenseBucket(), objectName,
                    file.getInputStream(), metadata);

            // 返回永久有效的公网 URL（需在 OSS 控制台将 bucket 设为公共读）
            return "https://" + ossConfig.getLicenseBucket() + "."
                    + ossConfig.getLicenseRegion() + ".aliyuncs.com/" + objectName;
        } catch (IOException e) {
            throw new RuntimeException("营业执照上传失败: " + e.getMessage(), e);
        }
    }

    private static final long MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_ATTACHMENT_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/msword" // .doc
    };

    @Override
    public String uploadSupplyAttachment(MultipartFile file) {
        validateFile(file, MAX_ATTACHMENT_SIZE, ALLOWED_ATTACHMENT_TYPES);

        String objectName = "fujian/" + UUID.randomUUID().toString().replace("-", "")
                + getFileExtension(file.getOriginalFilename());

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            avatarOSSClient.putObject(ossConfig.getAvatarBucket(), objectName,
                    file.getInputStream(), metadata);

            return "https://" + ossConfig.getAvatarBucket() + "."
                    + ossConfig.getAvatarRegion() + ".aliyuncs.com/" + objectName;
        } catch (IOException e) {
            throw new RuntimeException("附件上传失败: " + e.getMessage(), e);
        }
    }

    private void validateFile(MultipartFile file, long maxSize, String[] allowedTypes) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("请选择要上传的文件");
        }

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("文件大小不能超过 " + (maxSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        boolean allowed = false;
        if (contentType != null) {
            for (String type : allowedTypes) {
                if (type.equalsIgnoreCase(contentType)) {
                    allowed = true;
                    break;
                }
            }
        }

        if (!allowed) {
            throw new IllegalArgumentException("不支持的文件类型");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return ".jpg";
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(lastDot);
        }
        return ".jpg";
    }
}
