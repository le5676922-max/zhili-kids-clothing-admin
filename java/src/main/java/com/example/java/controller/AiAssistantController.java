package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.service.KnowledgeBaseService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 助手控制器（双模型架构）
 * - 纯文本：DeepSeek V4 Flash
 * - 含图片：阿里云 DashScope Qwen VL Plus（视觉模型）
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiAssistantController {

    private final ObjectMapper objectMapper;
    private final KnowledgeBaseService knowledgeBaseService;

    // ---- DeepSeek（纯文本） ----
    @Value("${deepseek.api-key}")
    private String deepseekApiKey;
    private static final String DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
    private static final String DEEPSEEK_MODEL = "deepseek-v4-flash";

    // ---- 阿里云 DashScope（视觉） ----
    @Value("${dashscope.api-key}")
    private String dashscopeApiKey;
    private static final String DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
    private static final String DASHSCOPE_VISION_MODEL = "qwen3.5-omni-plus-2026-03-15";

    public AiAssistantController(ObjectMapper objectMapper, KnowledgeBaseService knowledgeBaseService) {
        this.objectMapper = objectMapper;
        this.knowledgeBaseService = knowledgeBaseService;
    }

    @PostMapping("/chat")
    public R<AiReplyVO> chat(@RequestBody ChatRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            return R.fail(400, "消息列表不能为空");
        }

        try {
            // 1. 获取用户最新消息
            MessageDTO lastMessage = request.getMessages().get(request.getMessages().size() - 1);
            String userInput = extractTextContent(lastMessage.getContent());

            // 2. 检索相关知识
            String knowledge = knowledgeBaseService.searchKnowledge(userInput);

            // 3. 判断是否为多模态（含图片）
            boolean hasImage = containsImage(request.getMessages());

            // 4. 根据是否有图片选择模型和 API
            String apiUrl, apiKey, model;
            if (hasImage) {
                apiUrl = DASHSCOPE_URL;
                apiKey = dashscopeApiKey;
                model = DASHSCOPE_VISION_MODEL;
                log.info("检测到图片，使用阿里云 Qwen VL 视觉模型");
            } else {
                apiUrl = DEEPSEEK_URL;
                apiKey = deepseekApiKey;
                model = DEEPSEEK_MODEL;
            }

            // 5. 构建消息列表（含系统提示和知识库）
            List<Map<String, Object>> enhancedMessages = buildMessages(request.getMessages(), knowledge);

            // 6. 发送请求
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", enhancedMessages);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(30))
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(120))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String reply = extractReply(root);
                if (reply != null) {
                    return R.success(new AiReplyVO(reply));
                } else {
                    return R.fail(500, "AI 响应格式异常");
                }
            } else {
                String svc = hasImage ? "DashScope" : "DeepSeek";
                log.error("{} API 调用失败: status={}, body={}", svc, response.statusCode(), response.body());
                String errorMsg = "AI 服务暂时不可用";
                try {
                    JsonNode errorNode = objectMapper.readTree(response.body());
                    if (errorNode.has("error") && errorNode.get("error").has("message")) {
                        errorMsg = errorNode.get("error").get("message").asText();
                    }
                } catch (Exception ignored) {}
                return R.fail(500, errorMsg);
            }

        } catch (IOException | InterruptedException e) {
            log.error("AI 调用失败", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return R.fail(500, "AI 服务暂时不可用: " + e.getMessage());
        }
    }

    /** 构建消息列表：系统提示 + 知识库 + 历史消息 */
    private List<Map<String, Object>> buildMessages(List<MessageDTO> originalMessages, String knowledge) {
        List<Map<String, Object>> messages = new ArrayList<>();

        // 系统提示词
        String systemPrompt = knowledgeBaseService.getSystemPrompt();
        if (knowledge != null && !knowledge.isEmpty()) {
            systemPrompt += "\n\n【相关知识库内容】\n" + knowledge;
        }
        Map<String, Object> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        // 历史消息（保持原样，包括图片等多媒体内容）
        for (MessageDTO dto : originalMessages) {
            Map<String, Object> msg = new HashMap<>();
            msg.put("role", dto.getRole());
            msg.put("content", dto.getContent());
            messages.add(msg);
        }

        return messages;
    }

    /** 提取消息中的纯文本内容 */
    private String extractTextContent(Object content) {
        if (content instanceof String) {
            return (String) content;
        } else if (content instanceof List) {
            List<?> list = (List<?>) content;
            StringBuilder sb = new StringBuilder();
            for (Object item : list) {
                if (item instanceof Map) {
                    Map<?, ?> m = (Map<?, ?>) item;
                    if ("text".equals(m.get("type")) && m.get("text") != null) {
                        sb.append(m.get("text"));
                    }
                }
            }
            return sb.toString();
        }
        return "";
    }

    /** 检查消息列表是否包含图片 */
    private boolean containsImage(List<MessageDTO> messages) {
        for (MessageDTO msg : messages) {
            Object content = msg.getContent();
            if (content instanceof List) {
                for (Object item : (List<?>) content) {
                    if (item instanceof Map) {
                        if ("image_url".equals(((Map<?, ?>) item).get("type"))) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /** 从响应中提取回复文本（兼容 OpenAI / DashScope 格式） */
    private String extractReply(JsonNode root) {
        // OpenAI 兼容格式：choices[0].message.content
        if (root.has("choices") && root.get("choices").isArray() && root.get("choices").size() > 0) {
            JsonNode choice = root.get("choices").get(0);
            if (choice.has("message") && choice.get("message").has("content")) {
                return choice.get("message").get("content").asText();
            }
            // DashScope 旧格式：output.text
            if (choice.has("output")) {
                JsonNode output = choice.get("output");
                if (output.has("text")) return output.get("text").asText();
                if (output.has("content")) return output.get("content").asText();
            }
        }
        if (root.has("content")) return root.get("content").asText();
        if (root.has("output") && root.get("output").has("text")) return root.get("output").get("text").asText();
        return null;
    }

    // ==================== DTO ====================

    public static class ChatRequest {
        private List<MessageDTO> messages;
        public List<MessageDTO> getMessages() { return messages; }
        public void setMessages(List<MessageDTO> messages) { this.messages = messages; }
    }

    public static class MessageDTO {
        private String role;
        private Object content;
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Object getContent() { return content; }
        public void setContent(Object content) { this.content = content; }
    }

    public static class AiReplyVO {
        private String reply;
        public AiReplyVO(String reply) { this.reply = reply; }
        public String getReply() { return reply; }
        public void setReply(String reply) { this.reply = reply; }
    }
}