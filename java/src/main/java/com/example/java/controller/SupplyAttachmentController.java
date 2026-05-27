package com.example.java.controller;

import com.example.java.entity.SupplyAttachment;
import com.example.java.mapper.SupplyAttachmentMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * 供需附件：通过后端代理 OSS 地址，设置 Content-Disposition: attachment，便于浏览器直接下载。
 */
@RestController
@RequestMapping("/api/supply/attachment")
@RequiredArgsConstructor
public class SupplyAttachmentController {

    private final SupplyAttachmentMapper supplyAttachmentMapper;

    @GetMapping("/download/{id}")
    public void download(@PathVariable Integer id, HttpServletResponse response) throws IOException {
        SupplyAttachment att = supplyAttachmentMapper.selectById(id);
        if (att == null || att.getFileUrl() == null || att.getFileUrl().isBlank()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String fileUrl = att.getFileUrl().trim();
        String fileName = (att.getFileName() != null && !att.getFileName().isBlank())
                ? att.getFileName().trim()
                : "attachment";

        if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        HttpURLConnection conn = null;
        try {
            URL url = new URL(fileUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(120000);
            conn.setRequestMethod("GET");
            conn.setInstanceFollowRedirects(true);

            int code = conn.getResponseCode();
            if (code >= 400) {
                response.sendError(HttpServletResponse.SC_BAD_GATEWAY, "无法从存储地址获取文件");
                return;
            }

            String contentType = conn.getContentType();
            if (contentType != null && !contentType.isBlank()) {
                String lower = contentType.toLowerCase();
                if (!lower.contains("text/html") && !lower.contains("application/xhtml")) {
                    response.setContentType(contentType);
                } else {
                    response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
                }
            } else {
                response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
            }

            ContentDisposition cd = ContentDisposition.attachment()
                    .filename(fileName, StandardCharsets.UTF_8)
                    .build();
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, cd.toString());

            long len = conn.getContentLengthLong();
            if (len > 0) {
                response.setContentLengthLong(len);
            }

            try (InputStream in = conn.getInputStream(); OutputStream out = response.getOutputStream()) {
                in.transferTo(out);
            }
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
