package com.example.java.service.impl;

import com.example.java.exception.BusinessException;
import com.example.java.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${verify-code.expire-minutes:5}")
    private int expireMinutes;

    /** 验证码缓存: email -> CodeInfo */
    private final Map<String, CodeInfo> codeCache = new ConcurrentHashMap<>();
    /** 发送时间记录: email -> 上次发送时间戳(毫秒) */
    private final Map<String, Long> sendTimeCache = new ConcurrentHashMap<>();
    /** 发送次数记录: email -> 24小时内的发送次数 */
    private final Map<String, Integer> dailyCountCache = new ConcurrentHashMap<>();
    /** 发送次数日期: email -> 记录日期(yyyyMMdd)，用于跨天重置计数 */
    private final Map<String, String> dailyDateCache = new ConcurrentHashMap<>();

    private static final long RESEND_INTERVAL_MS = 60_000L; // 60秒内不能重复发送
    private static final int DAILY_LIMIT = 20;               // 同一邮箱每天最多发送20次
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Override
    public String sendVerifyCode(String email) throws BusinessException {
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BusinessException("邮箱格式不正确");
        }

        // ========== 频率限制检查 ==========
        long now = System.currentTimeMillis();
        String today = LocalDate.now().format(DATE_FMT);

        // 跨天重置计数
        String cachedDate = dailyDateCache.get(email);
        if (cachedDate != null && !cachedDate.equals(today)) {
            dailyCountCache.remove(email);
            dailyDateCache.remove(email);
        }

        // 检查 60 秒冷却期
        Long lastSendTime = sendTimeCache.get(email);
        if (lastSendTime != null && (now - lastSendTime) < RESEND_INTERVAL_MS) {
            long remaining = (RESEND_INTERVAL_MS - (now - lastSendTime)) / 1000;
            throw new BusinessException("发送太频繁，请在 " + remaining + " 秒后重试");
        }

        // 检查每日发送次数上限
        int dailyCount = dailyCountCache.getOrDefault(email, 0);
        if (dailyCount >= DAILY_LIMIT) {
            throw new BusinessException("今日发送次数已达上限（" + DAILY_LIMIT + " 次），请明日再试");
        }

        // 生成6位验证码
        String code = generateCode();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("织里童装产业系统 - 验证码");
            message.setText("您的验证码是：" + code + "，有效期" + expireMinutes + "分钟。请勿泄露给他人。");

            mailSender.send(message);

            // 存入缓存
            long cacheExpire = now + expireMinutes * 60 * 1000L;
            codeCache.put(email, new CodeInfo(code, cacheExpire));
            sendTimeCache.put(email, now);
            dailyCountCache.put(email, dailyCount + 1);
            dailyDateCache.put(email, today);

            log.info("验证码已发送到: {}", email);
            return code;
        } catch (Exception e) {
            log.error("发送验证码失败: {}", e.getMessage());
            throw new BusinessException("发送验证码失败，请稍后重试");
        }
    }

    @Override
    public boolean verifyCode(String email, String code) {
        // 尝试普通验证码
        CodeInfo info = codeCache.get(email);

        // 如果没找到，尝试邮箱修改验证码
        if (info == null) {
            info = codeCache.get("change:" + email);
        }

        if (info == null) {
            return false;
        }

        // 检查是否过期
        if (System.currentTimeMillis() > info.expireTime) {
            codeCache.remove(email);
            codeCache.remove("change:" + email);
            return false;
        }

        // 验证成功后删除验证码（防止重复使用）
        if (info.code.equals(code)) {
            codeCache.remove(email);
            codeCache.remove("change:" + email);
            return true;
        }

        return false;
    }

    private String generateCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    @Override
    public void sendEmailChangeCode(String oldEmail, String newEmail) throws BusinessException {
        if (newEmail == null || !newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BusinessException("邮箱格式不正确");
        }

        // 生成6位验证码
        String code = generateCode();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(newEmail);
            message.setSubject("织里童装产业系统 - 修改邮箱验证码");
            message.setText("您的邮箱修改验证码是：" + code + "，有效期" + expireMinutes + "分钟。请勿泄露给他人。");

            mailSender.send(message);

            // 存入缓存，使用特殊前缀区分类型
            long changeCacheExpire = System.currentTimeMillis() + expireMinutes * 60 * 1000L;
            codeCache.put("change:" + newEmail, new CodeInfo(code, changeCacheExpire));

            log.info("邮箱修改验证码已发送到: {}", newEmail);
        } catch (Exception e) {
            log.error("发送邮箱修改验证码失败: {}", e.getMessage());
            throw new BusinessException("发送验证码失败，请稍后重试");
        }
    }

    private static class CodeInfo {
        String code;
        long expireTime;

        CodeInfo(String code, long expireTime) {
            this.code = code;
            this.expireTime = expireTime;
        }
    }
}
