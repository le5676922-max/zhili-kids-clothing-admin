package com.example.java.config;

import com.example.java.websocket.ChatEndpoint;
import jakarta.websocket.DeploymentException;
import jakarta.websocket.server.ServerEndpointConfig;
import jakarta.servlet.ServletContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.context.ServletContextAware;

/**
 * 原生 WebSocket 配置类（Phase 1 基础架构）
 *
 * 职责：向 WebSocket 容器注册 ChatEndpoint，并绑定握手鉴权拦截器
 *
 * 对比说明：
 * - 本类：原生 WebSocket（javax.websocket），轻量、手动管理 Session，适合一对一私聊
 * - WebSocketConfig：STOMP over SockJS，功能更丰富（订阅/广播），适合复杂消息系统
 *
 * 本项目两套并存：
 *   /ws          → STOMP，工单系统（已有）
 *   /ws/chat     → 原生 WebSocket，实时聊天（新增）
 */
@Slf4j
@Component
public class NativeWebSocketConfig implements ApplicationListener<ContextRefreshedEvent>, ApplicationContextAware,
        ServletContextAware {

    /** Servlet 规范：嵌入式 Tomcat 将 ServerContainer 放在该属性名下 */
    private static final String SERVER_CONTAINER_ATTR = jakarta.websocket.server.ServerContainer.class.getName();

    private ApplicationContext applicationContext;
    private ServletContext servletContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Override
    public void setServletContext(ServletContext servletContext) {
        this.servletContext = servletContext;
    }

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // 确保只执行一次
        if (event.getApplicationContext().getParent() != null) {
            return;
        }

        // 从 Spring 容器中获取握手拦截器（Phase 3 核心）
        ChatWsHandshakeInterceptor interceptor = applicationContext.getBean(ChatWsHandshakeInterceptor.class);

        // ServerContainer 不是 Spring Bean，需从 ServletContext 读取（Tomcat 启动时写入）
        if (servletContext == null) {
            log.error("【WebSocket】ServletContext 为空，无法注册原生端点");
            return;
        }
        try {
            Object attr = servletContext.getAttribute(SERVER_CONTAINER_ATTR);
            if (!(attr instanceof jakarta.websocket.server.ServerContainer serverContainer)) {
                log.error("【WebSocket】ServletContext 中未找到 ServerContainer，属性名={}", SERVER_CONTAINER_ATTR);
                return;
            }

            // 构建 Endpoint 配置：绑定地址 + 握手鉴权拦截器
            ServerEndpointConfig config = ServerEndpointConfig.Builder
                    .create(ChatEndpoint.class, "/chat")
                    .configurator(interceptor)
                    .build();

            // 注册到 WebSocket 容器
            serverContainer.addEndpoint(config);

            log.info("【WebSocket】原生端点 /ws/chat 注册成功，握手鉴权拦截器已绑定");

        } catch (DeploymentException e) {
            log.error("【WebSocket】注册 /chat 端点失败", e);
        }
    }
}
