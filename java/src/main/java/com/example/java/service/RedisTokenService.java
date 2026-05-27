package com.example.java.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Redis Token 黑名单管理服务
 *
 * 功能说明：
 * - 登录时：Token 存入 Redis，Key=token，Value=用户信息，过期时间与 JWT 一致
 * - 验证时：检查 Redis 中该 Token 是否存在（存在=有效，不存在=已注销/过期）
 * - 注销时：从 Redis 中删除该 Token，使其立即失效
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisTokenService {

    private final StringRedisTemplate redisTemplate;

    /** Redis 中 Token 存储的前缀，统一管理方便后续扩展 */
    private static final String TOKEN_PREFIX = "jwt:token:";
    /** 存储用户 -> Token 集合的映射 Key 前缀（用于清除用户所有旧 Token） */
    private static final String USER_TOKEN_SET_PREFIX = "jwt:user:";

    /**
     * 将 Token 存入 Redis，并设置与 JWT 相同的过期时间
     *
     * @param token             JWT Token
     * @param userId            用户ID
     * @param expirationMillis  过期时间（毫秒），与 JWT 过期时间一致
     */
    public void saveToken(String token, String userId, long expirationMillis) {
        try {
            String key = TOKEN_PREFIX + token;
            long expirationSeconds = expirationMillis / 1000;
            redisTemplate.opsForValue().set(key, userId, expirationSeconds, TimeUnit.SECONDS);
            // 同时将 token 加入用户的 token 集合，方便登录时清除旧 token
            String userSetKey = USER_TOKEN_SET_PREFIX + userId;
            redisTemplate.opsForSet().add(userSetKey, token);
            redisTemplate.expire(userSetKey, expirationSeconds, TimeUnit.SECONDS);
            log.info("Token 已存入 Redis，userId={}，过期时间={}秒", userId, expirationSeconds);
        } catch (Exception e) {
            log.error("Token 存入 Redis 失败，userId={}", userId, e);
        }
    }

    /**
     * 将 Token 存入 Redis，使用默认 24 小时过期
     *
     * @param token  JWT Token
     * @param userId 用户ID
     */
    public void saveToken(String token, String userId) {
        saveToken(token, userId, 43200000L); // 默认 12 小时
    }

    /**
     * 验证 Token 是否存在于 Redis（存在于 Redis = 有效 / 不存在 = 已注销）
     *
     * @param token JWT Token
     * @return true=Token 有效，false=Token 已注销或不存在
     */
    public boolean isTokenValid(String token) {
        try {
            String key = TOKEN_PREFIX + token;
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Redis 查询 Token 失败，token={}", token, e);
            // 查询失败时降级：返回 true（依赖 JWT 本身的有效性，不阻断用户）
            return true;
        }
    }

    /**
     * 注销 Token：从 Redis 中删除，使其立即失效
     *
     * @param token JWT Token
     */
    public void removeToken(String token) {
        try {
            String key = TOKEN_PREFIX + token;
            // 先查出 userId，再从用户 token 集合中移除
            String userId = redisTemplate.opsForValue().get(key);
            Boolean deleted = redisTemplate.delete(key);
            if (Boolean.TRUE.equals(deleted)) {
                log.info("Token 已从 Redis 删除");
            }
            if (userId != null) {
                redisTemplate.opsForSet().remove(USER_TOKEN_SET_PREFIX + userId, token);
            }
        } catch (Exception e) {
            log.error("从 Redis 删除 Token 失败", e);
        }
    }

    /**
     * 清除用户的所有旧 Token（登录时调用，防止同一账号多处登录）
     *
     * @param userId 用户ID
     */
    public void removeTokensByUserId(String userId) {
        try {
            String userSetKey = USER_TOKEN_SET_PREFIX + userId;
            Set<String> tokens = redisTemplate.opsForSet().members(userSetKey);
            if (tokens != null && !tokens.isEmpty()) {
                List<String> keysToDelete = tokens.stream()
                        .map(t -> TOKEN_PREFIX + t)
                        .collect(Collectors.toList());
                redisTemplate.delete(keysToDelete);
                redisTemplate.delete(userSetKey);
                log.info("已清除用户 {} 的 {} 个旧 Token", userId, tokens.size());
            }
        } catch (Exception e) {
            log.error("清除用户旧 Token 失败，userId={}", userId, e);
        }
    }
}
