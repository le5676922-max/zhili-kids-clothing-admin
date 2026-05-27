package com.example.java.service.impl;

import com.example.java.dto.SupplyAttachmentVO;
import com.example.java.dto.SupplyDemandCreateRequest;
import com.example.java.dto.SupplyDemandVO;
import com.example.java.entity.SupplyAttachment;
import com.example.java.entity.SupplyDemand;
import com.example.java.mapper.SupplyAttachmentMapper;
import com.example.java.mapper.SupplyDemandMapper;
import com.example.java.service.SupplyDemandService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 需求信息服务实现
 */
@Service
@RequiredArgsConstructor
public class SupplyDemandServiceImpl implements SupplyDemandService {

    private final SupplyDemandMapper supplyDemandMapper;
    private final SupplyAttachmentMapper supplyAttachmentMapper;
    private final UserService userService;

    @Override
    public List<SupplyDemandVO> getAllDemands() {
        List<SupplyDemandVO> demands = supplyDemandMapper.findAll();
        // 为每个需求加载附件
        demands.forEach(this::loadAttachments);
        return demands;
    }

    @Override
    public List<SupplyDemandVO> searchDemands(String keyword, String type, String urgency, String status) {
        List<SupplyDemandVO> demands = supplyDemandMapper.search(keyword, type, urgency, status);
        demands.forEach(this::loadAttachments);
        return demands;
    }

    @Override
    public SupplyDemandVO getDemandById(Integer id) {
        SupplyDemandVO demand = supplyDemandMapper.selectById(id);
        if (demand != null) {
            loadAttachments(demand);
            // 增加浏览次数
            supplyDemandMapper.incrementViewCount(id);
        }
        return demand;
    }

    @Override
    public List<SupplyDemandVO> getDemandsByUserId(String userId) {
        List<SupplyDemandVO> demands = supplyDemandMapper.findByUserId(userId);
        demands.forEach(this::loadAttachments);
        return demands;
    }

    @Override
    @Transactional
    public boolean publishDemand(SupplyDemandCreateRequest request, String userId) {
        // 获取企业信息
        var user = userService.getUserById(userId);
        if (user == null || user.getUserType() != 2) {
            throw new RuntimeException("仅企业用户可发布需求");
        }

        // 生成需求编号
        String demandId = generateDemandId();

        // 创建需求实体
        SupplyDemand demand = new SupplyDemand();
        demand.setDemandId(demandId);
        demand.setTitle(request.getTitle());
        demand.setType(request.getType());
        demand.setCategory(request.getCategory());
        demand.setUrgency(request.getUrgency() != null ? request.getUrgency() : "medium");
        demand.setStatus("open");
        demand.setUserId(userId);
        demand.setCompanyName(request.getCompanyName() != null ? request.getCompanyName() : user.getEnterpriseName());
        demand.setContactName(request.getContactName());
        demand.setContactPhone(request.getContactPhone());
        demand.setEmail(request.getEmail());
        demand.setLocation(request.getLocation() != null ? request.getLocation() : "浙江省湖州市");
        demand.setDescription(request.getDescription());
        demand.setSpecifications(request.getSpecifications());
        demand.setBudget(request.getBudget());
        demand.setDeadline(request.getDeadline());
        demand.setPublishDate(LocalDate.now());
        demand.setTags(request.getTags());
        demand.setRequirements(request.getRequirements());
        demand.setViewCount(0);
        demand.setCreatedAt(LocalDateTime.now());
        demand.setUpdatedAt(LocalDateTime.now());

        // 插入需求
        int result = supplyDemandMapper.insert(demand);
        if (result <= 0) {
            return false;
        }

        // 保存附件
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            saveAttachments(demand.getId(), null, request.getAttachments());
        }

        return true;
    }

    @Override
    @Transactional
    public boolean updateDemand(Integer id, SupplyDemandCreateRequest request) {
        SupplyDemandVO existing = supplyDemandMapper.selectById(id);
        if (existing == null) {
            return false;
        }

        SupplyDemand demand = new SupplyDemand();
        demand.setId(id);
        demand.setTitle(request.getTitle());
        demand.setType(request.getType());
        demand.setCategory(request.getCategory());
        demand.setUrgency(request.getUrgency());
        demand.setCompanyName(request.getCompanyName());
        demand.setContactName(request.getContactName());
        demand.setContactPhone(request.getContactPhone());
        demand.setEmail(request.getEmail());
        demand.setLocation(request.getLocation());
        demand.setDescription(request.getDescription());
        demand.setSpecifications(request.getSpecifications());
        demand.setBudget(request.getBudget());
        demand.setDeadline(request.getDeadline());
        demand.setTags(request.getTags());
        demand.setRequirements(request.getRequirements());
        demand.setUpdatedAt(LocalDateTime.now());

        int result = supplyDemandMapper.update(demand);
        if (result <= 0) {
            return false;
        }

        // 更新附件：先删除旧的，再添加新的
        supplyAttachmentMapper.deleteByDemandId(id);
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            saveAttachments(id, null, request.getAttachments());
        }

        return true;
    }

    @Override
    @Transactional
    public boolean deleteDemand(Integer id) {
        // 先删除附件
        supplyAttachmentMapper.deleteByDemandId(id);
        // 再删除需求
        return supplyDemandMapper.deleteById(id) > 0;
    }

    @Override
    public void incrementViewCount(Integer id) {
        supplyDemandMapper.incrementViewCount(id);
    }

    /**
     * 为需求加载附件列表
     */
    private void loadAttachments(SupplyDemandVO demand) {
        List<SupplyAttachmentVO> attachments = supplyAttachmentMapper.findByDemandId(demand.getId());
        demand.setAttachments(attachments);
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
     * 生成需求编号：DM + 年月日 + 6位随机数（避免时间戳冲突）
     */
    private String generateDemandId() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%06d", (int) (Math.random() * 999999));
        return "DM" + dateStr + seq;
    }
}
