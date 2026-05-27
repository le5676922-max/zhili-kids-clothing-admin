package com.example.java.websocket;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * Spring 上下文持有器
 *
 * 用途：在非 Spring 管理的类（如 WebSocket 端点 @ServerEndpoint）中获取 Spring Bean
 *
 * WebSocket 端点由 WebSocket 容器直接创建，不归 Spring 管理，
 * 所以无法使用 @Autowired 注入。需要通过此类从 Spring 容器手动获取。
 *
 * 使用方式：
 *   MyService service = SpringContextHolder.getBean(MyService.class);
 */
@Component
public class SpringContextHolder implements ApplicationContextAware {

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext context) throws BeansException {
        applicationContext = context;
    }

    /**
     * 根据类型从 Spring 容器获取 Bean
     */
    public static <T> T getBean(Class<T> clazz) {
        return applicationContext.getBean(clazz);
    }

    /**
     * 根据名称从 Spring 容器获取 Bean
     */
    public static Object getBean(String name) {
        return applicationContext.getBean(name);
    }
}
