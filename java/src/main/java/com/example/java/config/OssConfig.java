package com.example.java.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 阿里云 OSS 配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssConfig {

    /** AccessKey ID */
    private String accessKeyId;

    /** AccessKey Secret */
    private String accessKeySecret;

    /** 头像 bucket 名称 */
    private String avatarBucket = "zhili-kids-industry-system";

    /** 头像 bucket 区域 */
    private String avatarRegion = "oss-cn-hangzhou";

    /** 营业执照 bucket 名称 */
    private String licenseBucket = "yingyezhizhao-zhili-kids-system";

    /** 营业执照 bucket 区域 */
    private String licenseRegion = "oss-cn-beijing";

    /**
     * 创建头像 OSS 客户端
     */
    @Bean("avatarOSSClient")
    public OSS avatarOSSClient() {
        return new OSSClientBuilder().build(
                "https://" + avatarRegion + ".aliyuncs.com",
                accessKeyId,
                accessKeySecret
        );
    }

    /**
     * 创建营业执照 OSS 客户端
     */
    @Bean("licenseOSSClient")
    public OSS licenseOSSClient() {
        return new OSSClientBuilder().build(
                "https://" + licenseRegion + ".aliyuncs.com",
                accessKeyId,
                accessKeySecret
        );
    }
}
