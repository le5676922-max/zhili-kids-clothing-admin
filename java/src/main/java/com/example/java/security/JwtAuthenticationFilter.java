package com.example.java.security;

import com.example.java.service.RedisTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 认证过滤器（Phase 2 + Phase 3）
 *
 * 鉴权流程：
 * 1. 从请求头 Authorization 字段提取 Bearer <token>
 * 2. JWT 签名校验（验证 Token 是否被篡改）
 * 3. Redis 黑名单校验（验证 Token 是否已被主动注销）
 * 4. 用户信息加载并写入 Spring Security 上下文
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final RedisTokenService redisTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String jwt = null;
        boolean hasJwt = false;

        try {
            jwt = getJwtFromRequest(request);
            hasJwt = StringUtils.hasText(jwt);

            // ----- 有 Token 才走完整校验流程 -----
            if (hasJwt) {
                // ----- Phase 3：检查 Redis 黑名单 -----
                if (!jwtUtils.validateToken(jwt)) {
                    sendUnauthorizedResponse(response, "Token 无效或已过期，请重新登录");
                    return;
                }

                if (!redisTokenService.isTokenValid(jwt)) {
                    sendUnauthorizedResponse(response, "您的账号已在其他设备登录，请重新登录");
                    return;
                }

                String email = jwtUtils.getEmail(jwt);
                if (!StringUtils.hasText(email)) {
                    email = jwtUtils.getUsername(jwt);
                }
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            // 无 Token → 匿名请求，交由 SecurityConfig 的规则判断（permitAll 路径放行，需认证的路径返回 403）

        } catch (UsernameNotFoundException e) {
            // JWT 有效但用户已被删除（如管理员注销）→ 返回 401 提示前端弹窗并跳转登录
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "账号已被管理员注销");
            return;
        } catch (Exception ex) {
            // 解析异常、内部错误等非预期异常 → 清除上下文并返回 401
            // 关键修复：不再静默放行，不再继续 filterChain
            logger.error("JWT 认证过滤器非预期异常，已拒绝请求", ex);
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "认证失败，请重新登录");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 从 HTTP 请求头提取 Bearer Token
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 向前端返回 401 未授权响应
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        Map<String, Object> body = new HashMap<>();
        body.put("code", 401);
        body.put("message", message);
        body.put("data", null);
        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
        response.getWriter().flush();
    }
}
