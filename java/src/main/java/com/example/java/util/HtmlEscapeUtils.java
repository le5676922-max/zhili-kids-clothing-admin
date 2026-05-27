package com.example.java.util;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * XSS 防护工具类
 *
 * 在消息入库和转发前，统一对 HTML 特殊字符进行转义，
 * 防止用户输入的脚本被浏览器解析执行（存储型 XSS）。
 *
 * 使用场景：聊天消息、评论、内容展示等所有用户可控文本字段。
 */
@Component
public class HtmlEscapeUtils {

    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
            "<\\s*script[^>]*>.*?<\\s*/\\s*script\\s*>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern EVENT_HANDLER_PATTERN = Pattern.compile(
            "\\bon\\w+\\s*=",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern DANGEROUS_TAG_PATTERN = Pattern.compile(
            "<\\s*(iframe|object|embed|link|style|base|meta|import)\\s*[^>]*>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    /**
     * 对字符串进行 HTML 实体转义
     *
     * 转换规则：
     *   <  → &lt;
     *   >  → &gt;
     *   &  → &amp;   (仅当后面不是已命名的实体时才转)
     *   "  → &quot;
     *   '  → &#39;
     *   /  → &#47;   (防止 </script> 逃逸)
     */
    public static String escapeHtml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        String escaped = input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;")
                .replace("/", "&#47;");

        return escaped;
    }

    /**
     * 对字符串进行严格安全过滤（转义 + 移除危险标签）
     *
     * 在转义的基础上，额外移除：
     *   - <script>...</script> 块
     *   - onxxx= 事件处理器属性
     *   - iframe/object/embed 等危险标签
     */
    public static String escapeAndStrip(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        String result = input;

        // 先移除危险标签块（转义前移除，防止标签内含转义字符）
        result = SCRIPT_PATTERN.matcher(result).replaceAll("");
        result = EVENT_HANDLER_PATTERN.matcher(result).replaceAll(" _disabled=");
        result = DANGEROUS_TAG_PATTERN.matcher(result).replaceAll("");

        // 再进行 HTML 转义
        return escapeHtml(result);
    }

    /**
     * 消息内容的最大长度限制（防止超长消息攻击）
     */
    public static String truncateAndEscape(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        String truncated = input.length() > maxLength ? input.substring(0, maxLength) : input;
        return escapeAndStrip(truncated);
    }
}
