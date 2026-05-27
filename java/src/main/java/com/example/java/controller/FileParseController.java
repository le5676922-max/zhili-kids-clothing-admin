package com.example.java.controller;

import com.example.java.common.R;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * 文件解析控制器
 * 支持 PDF、Word(.docx)、TXT 文件的文本提取
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class FileParseController {

    /** 最大解析字符数（防止超大文件撑爆上下文） */
    private static final int MAX_CHARS = 8000;

    @PostMapping("/parse-file")
    public R<String> parseFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return R.fail(400, "文件为空");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            return R.fail(400, "无法识别文件名");
        }

        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')).toLowerCase() : "";

        try {
            String text = switch (ext) {
                case ".pdf"  -> parsePdf(file);
                case ".docx" -> parseDocx(file);
                case ".txt", ".log", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".properties", ".html", ".htm", ".java", ".py", ".js", ".ts", ".css", ".sql" -> parseText(file);
                default -> {
                    log.warn("不支持的文件类型: {}", ext);
                    yield null;
                }
            };

            if (text == null) {
                return R.fail(400, "不支持的文件格式：" + ext + "，仅支持 PDF、Word(.docx)、TXT 及常见代码文本文件");
            }

            if (text.isBlank()) {
                return R.fail(400, "未能从文件中提取到文本内容，文件可能为空或为扫描图片");
            }

            // 截断过长文本
            if (text.length() > MAX_CHARS) {
                text = text.substring(0, MAX_CHARS) + "\n\n...[内容过长，已截断]";
            }

            log.info("文件解析成功: {} ({}) → {} 字符", filename, ext, text.length());
            return R.success(text);

        } catch (Exception e) {
            log.error("文件解析失败: {}", filename, e);
            return R.fail(500, "文件解析失败：" + e.getMessage());
        }
    }

    private String parsePdf(MultipartFile file) throws Exception {
        try (PDDocument doc = Loader.loadPDF(file.getBytes());
             PDDocument document = doc) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private String parseDocx(MultipartFile file) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    private String parseText(MultipartFile file) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            char[] buf = new char[4096];
            int n;
            while ((n = reader.read(buf)) != -1) {
                sb.append(buf, 0, n);
            }
        }
        return sb.toString();
    }
}
