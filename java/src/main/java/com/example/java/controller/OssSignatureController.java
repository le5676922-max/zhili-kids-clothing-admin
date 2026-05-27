package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.config.OssConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 阿里云 OSS 签名直传控制器
 * 前端先请求此接口获取上传凭证，然后直接上传到 OSS
 */
@RestController
@RequestMapping("/api/oss")
@RequiredArgsConstructor
public class OssSignatureController {

    private final OssConfig ossConfig;

    private static final String ALGORITHM = "HmacSHA1";

    /**
     * 获取头像上传签名
     * @param fileName 前端传来的文件名（可选，用于获取文件后缀）
     * @return 上传凭证信息
     */
    @GetMapping("/avatar-signature")
    public R<Map<String, String>> getAvatarSignature(@RequestParam(required = false) String fileName) {
        return getSignature(ossConfig.getAvatarBucket(), ossConfig.getAvatarRegion(), "avatars/", fileName);
    }

    /**
     * 获取营业执照上传签名
     * @param fileName 前端传来的文件名（可选）
     * @return 上传凭证信息
     */
    @GetMapping("/license-signature")
    public R<Map<String, String>> getLicenseSignature(@RequestParam(required = false) String fileName) {
        return getSignature(ossConfig.getLicenseBucket(), ossConfig.getLicenseRegion(), "licenses/", fileName);
    }

    /**
     * 生成 OSS 上传签名
     */
    private R<Map<String, String>> getSignature(String bucket, String region, String dirPrefix, String fileName) {
        String accessKeyId = ossConfig.getAccessKeyId();
        String accessKeySecret = ossConfig.getAccessKeySecret();

        if (accessKeyId == null || accessKeyId.isEmpty() || accessKeySecret == null || accessKeySecret.isEmpty()) {
            return R.error(500, "OSS 配置不完整，请检查 application.yaml 中的 aliyun.oss 配置");
        }

        // 生成文件路径
        String ext = getFileExt(fileName);
        String key = dirPrefix + UUID.randomUUID().toString().replace("-", "") + ext;

        // 签名有效期（15分钟）
        long expireTime = 15 * 60;
        long expireEnd = System.currentTimeMillis() + expireTime * 1000;
        Date expiration = new Date(expireEnd);

        // 生成策略 (兼容新版 OSS SDK)
        String policy;
        try {
            policy = generatePostPolicy(expiration, key);
        } catch (Exception e) {
            return R.error(500, "生成上传策略失败: " + e.getMessage());
        }

        // 生成签名
        String signature;
        try {
            signature = calculateSignature(accessKeySecret, policy);
        } catch (Exception e) {
            return R.error(500, "生成签名失败: " + e.getMessage());
        }

        // 返回给前端的信息
        Map<String, String> result = new HashMap<>();
        result.put("accessKeyId", accessKeyId);
        result.put("policy", policy);
        result.put("signature", signature);
        result.put("key", key);
        result.put("bucket", bucket);
        result.put("host", "https://" + bucket + "." + region + ".aliyuncs.com");
        result.put("expire", String.valueOf(expireEnd / 1000)); // 过期时间戳（秒）

        return R.success("获取签名成功", result);
    }

    /**
     * 生成 POST 策略 (兼容新版 OSS SDK)
     */
    private String generatePostPolicy(Date expiration, String key) throws Exception {
        // 构建策略 JSON (手动拼接避免依赖 Jackson)
        // 使用 starts-with 条件匹配 key，支持任意扩展名
        String expirationStr = String.format("%tFT%tT.000Z", expiration, expiration);
        String policyJson = "{\"expiration\":\"" + expirationStr + "\",\"conditions\":[[\"starts-with\",\"$key\",\"" + key + "\"],[\"content-length-range\",0," + (5 * 1024 * 1024) + "]]}";
        return Base64.getEncoder().encodeToString(policyJson.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 计算 OSS 签名 (HMAC-SHA1)
     */
    private String calculateSignature(String accessKeySecret, String policy) throws Exception {
        Mac mac = Mac.getInstance(ALGORITHM);
        SecretKeySpec secretKeySpec = new SecretKeySpec(accessKeySecret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
        mac.init(secretKeySpec);
        byte[] signData = mac.doFinal(policy.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(signData);
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExt(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return ".jpg";
        }
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            return fileName.substring(lastDot);
        }
        return ".jpg";
    }
}
