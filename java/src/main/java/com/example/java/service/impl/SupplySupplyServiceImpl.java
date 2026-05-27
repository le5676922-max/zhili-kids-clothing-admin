package com.example.java.service.impl;

import com.example.java.dto.SupplyAttachmentVO;
import com.example.java.dto.SupplySupplyCreateRequest;
import com.example.java.dto.SupplySupplyVO;
import com.example.java.entity.SupplyAttachment;
import com.example.java.entity.SupplySupply;
import com.example.java.mapper.SupplyAttachmentMapper;
import com.example.java.mapper.SupplySupplyMapper;
import com.example.java.service.SupplySupplyService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 供应信息服务实现
 */
@Service
@RequiredArgsConstructor
public class SupplySupplyServiceImpl implements SupplySupplyService {

    private final SupplySupplyMapper supplySupplyMapper;
    private final SupplyAttachmentMapper supplyAttachmentMapper;
    private final UserService userService;

    @Override
    public List<SupplySupplyVO> getAllSupplies() {
        List<SupplySupplyVO> supplies = supplySupplyMapper.findAll();
        supplies.forEach(this::loadAttachments);
        return supplies;
    }

    @Override
    public List<SupplySupplyVO> searchSupplies(String keyword, String type, String status) {
        List<SupplySupplyVO> supplies = supplySupplyMapper.search(keyword, type, status);
        supplies.forEach(this::loadAttachments);
        return supplies;
    }

    @Override
    public SupplySupplyVO getSupplyById(Integer id) {
        SupplySupplyVO supply = supplySupplyMapper.selectById(id);
        if (supply != null) {
            loadAttachments(supply);
            // 增加浏览次数
            supplySupplyMapper.incrementViewCount(id);
        }
        return supply;
    }

    @Override
    public List<SupplySupplyVO> getSuppliesByUserId(String userId) {
        List<SupplySupplyVO> supplies = supplySupplyMapper.findByUserId(userId);
        supplies.forEach(this::loadAttachments);
        return supplies;
    }

    @Override
    @Transactional
    public boolean publishSupply(SupplySupplyCreateRequest request, String userId) {
        // 获取企业信息
        var user = userService.getUserById(userId);
        if (user == null || user.getUserType() != 2) {
            throw new RuntimeException("仅企业用户可发布供应");
        }

        // 生成供应编号
        String supplyId = generateSupplyId();

        // 创建供应实体
        SupplySupply supply = new SupplySupply();
        supply.setSupplyId(supplyId);
        supply.setTitle(request.getTitle());
        supply.setType(request.getType());
        supply.setCategory(request.getCategory());
        supply.setStatus("available");
        supply.setUserId(userId);
        supply.setCompanyName(request.getCompanyName() != null ? request.getCompanyName() : user.getEnterpriseName());
        supply.setContactName(request.getContactName());
        supply.setContactPhone(request.getContactPhone());
        supply.setEmail(request.getEmail());
        supply.setLocation(request.getLocation() != null ? request.getLocation() : "浙江省湖州市");
        supply.setDescription(request.getDescription());
        supply.setSpecifications(request.getSpecifications());
        supply.setPrice(request.getPrice());
        supply.setCapacity(request.getCapacity());
        supply.setPublishDate(LocalDate.now());
        supply.setTags(request.getTags());
        supply.setAdvantages(request.getAdvantages());
        supply.setCertifications(request.getCertifications());
        supply.setViewCount(0);
        supply.setCreatedAt(LocalDateTime.now());
        supply.setUpdatedAt(LocalDateTime.now());

        // 插入供应
        int result = supplySupplyMapper.insert(supply);
        if (result <= 0) {
            return false;
        }

        // 保存附件
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            saveAttachments(null, supply.getId(), request.getAttachments());
        }

        return true;
    }

    @Override
    @Transactional
    public boolean updateSupply(Integer id, SupplySupplyCreateRequest request) {
        SupplySupplyVO existing = supplySupplyMapper.selectById(id);
        if (existing == null) {
            return false;
        }

        SupplySupply supply = new SupplySupply();
        supply.setId(id);
        supply.setTitle(request.getTitle());
        supply.setType(request.getType());
        supply.setCategory(request.getCategory());
        supply.setCompanyName(request.getCompanyName());
        supply.setContactName(request.getContactName());
        supply.setContactPhone(request.getContactPhone());
        supply.setEmail(request.getEmail());
        supply.setLocation(request.getLocation());
        supply.setDescription(request.getDescription());
        supply.setSpecifications(request.getSpecifications());
        supply.setPrice(request.getPrice());
        supply.setCapacity(request.getCapacity());
        supply.setTags(request.getTags());
        supply.setAdvantages(request.getAdvantages());
        supply.setCertifications(request.getCertifications());
        supply.setUpdatedAt(LocalDateTime.now());

        int result = supplySupplyMapper.update(supply);
        if (result <= 0) {
            return false;
        }

        // 更新附件：先删除旧的，再添加新的
        supplyAttachmentMapper.deleteBySupplyId(id);
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            saveAttachments(null, id, request.getAttachments());
        }

        return true;
    }

    @Override
    @Transactional
    public boolean deleteSupply(Integer id) {
        // 先删除附件
        supplyAttachmentMapper.deleteBySupplyId(id);
        // 再删除供应
        return supplySupplyMapper.deleteById(id) > 0;
    }

    /**
     * 为供应加载附件列表
     */
    private void loadAttachments(SupplySupplyVO supply) {
        List<SupplyAttachmentVO> attachments = supplyAttachmentMapper.findBySupplyId(supply.getId());
        supply.setAttachments(attachments);
    }

    /**
     * 保存附件
     */
    private void saveAttachments(Integer demandId, Integer supplyId, List<com.example.java.dto.AttachmentInfo> attachments) {
        for (com.example.java.dto.AttachmentInfo attInfo : attachments) {
            SupplyAttachment attachment = new SupplyAttachment();
            attachment.setDemandId(demandId);
            attachment.setSupplyId(supplyId);
            attachment.setFileUrl(attInfo.getFileUrl());
            attachment.setFileName(attInfo.getFileName() != null ? attInfo.getFileName() : extractFileNameFromUrl(attInfo.getFileUrl()));
            attachment.setFileType(attInfo.getFileType() != null ? attInfo.getFileType() : extractFileTypeFromUrl(attInfo.getFileUrl()));
            attachment.setFileSize(attInfo.getFileSize());
            attachment.setCreatedAt(LocalDateTime.now());
            supplyAttachmentMapper.insert(attachment);
        }
    }

    /**
     * 从URL提取文件名
     */
    private String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "附件.pdf";
        }
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < url.length() - 1) {
            return url.substring(lastSlash + 1);
        }
        return "附件.pdf";
    }

    /**
     * 从URL提取文件类型
     */
    private String extractFileTypeFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "pdf";
        }
        int lastDot = url.lastIndexOf('.');
        if (lastDot >= 0 && lastDot < url.length() - 1) {
            return url.substring(lastDot + 1).toLowerCase();
        }
        return "pdf";
    }

    /**
     * 生成供应编号：SP + 年月日 + 6位随机数（避免时间戳冲突）
     */
    private String generateSupplyId() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%06d", (int) (Math.random() * 999999));
        return "SP" + dateStr + seq;
    }
}
