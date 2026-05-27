package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    /**
     * 上传头像
     */
    @PostMapping("/avatar")
    public R<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadAvatar(file);
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            return R.success("上传成功", result);
        } catch (IllegalArgumentException e) {
            return R.error(400, e.getMessage());
        } catch (Exception e) {
            return R.error(500, "上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传营业执照
     */
    @PostMapping("/license")
    public R<Map<String, String>> uploadLicense(@RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadLicense(file);
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            return R.success("上传成功", result);
        } catch (IllegalArgumentException e) {
            return R.error(400, e.getMessage());
        } catch (Exception e) {
            return R.error(500, "上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传商品图片到阿里云 OSS（zhili-kids-industry-system / products/），需登录
     */
    @PostMapping("/product")
    public R<Map<String, String>> uploadProductImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadProductImage(file);
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            return R.success("上传成功", result);
        } catch (IllegalArgumentException e) {
            return R.error(400, e.getMessage());
        } catch (Exception e) {
            return R.error(500, "上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传简历图片到阿里云 OSS（zhili-kids-industry-system / jianli/），需登录
     */
    @PostMapping("/resume")
    public R<Map<String, String>> uploadResumeImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadResumeImage(file);
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            return R.success("上传成功", result);
        } catch (IllegalArgumentException e) {
            return R.error(400, e.getMessage());
        } catch (Exception e) {
            return R.error(500, "上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传供应链附件文档到阿里云 OSS（zhili-kids-industry-system / fujian/），需登录
     * 支持图片、PDF、Excel、Word等格式，最大10MB
     */
    @PostMapping("/supply/attachment")
    public R<Map<String, String>> uploadSupplyAttachment(@RequestParam("file") MultipartFile file) {
        try {
            String url = uploadService.uploadSupplyAttachment(file);
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            result.put("fileName", file.getOriginalFilename());
            result.put("fileSize", formatFileSize(file.getSize()));
            result.put("fileType", getFileType(file.getOriginalFilename()));
            return R.success("上传成功", result);
        } catch (IllegalArgumentException e) {
            return R.error(400, e.getMessage());
        } catch (Exception e) {
            return R.error(500, "上传失败: " + e.getMessage());
        }
    }

    /**
     * 格式化文件大小
     */
    private String formatFileSize(long size) {
        if (size < 1024) {
            return size + "B";
        } else if (size < 1024 * 1024) {
            return String.format("%.2fKB", size / 1024.0);
        } else {
            return String.format("%.2fMB", size / (1024.0 * 1024.0));
        }
    }

    /**
     * 获取文件类型
     */
    private String getFileType(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "unknown";
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot + 1).toLowerCase();
        }
        return "unknown";
    }
}
