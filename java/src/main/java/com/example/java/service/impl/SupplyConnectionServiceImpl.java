package com.example.java.service.impl;

import com.example.java.dto.MyPublishedItemVO;
import com.example.java.dto.MyPublishedItemVO.ConnectionRecordVO;
import com.example.java.dto.SupplyConnectionCreateRequest;
import com.example.java.dto.SupplyConnectionVO;
import com.example.java.dto.SupplyDemandVO;
import com.example.java.dto.SupplySupplyVO;
import com.example.java.entity.SupplyConnection;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.SupplyConnectionMapper;
import com.example.java.mapper.SupplyDemandMapper;
import com.example.java.mapper.SupplySupplyMapper;
import com.example.java.service.NotificationService;
import com.example.java.service.SupplyConnectionPushService;
import com.example.java.service.SupplyConnectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 供需对接服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupplyConnectionServiceImpl implements SupplyConnectionService {

    private final SupplyConnectionMapper connectionMapper;
    private final SupplyDemandMapper demandMapper;
    private final SupplySupplyMapper supplyMapper;
    private final NotificationService notificationService;
    private final SupplyConnectionPushService connectionPushService;

    /**
     * 更新需求状态
     */
    private void updateDemandStatus(Integer demandId, String status) {
        demandMapper.updateStatus(demandId, status);
    }

    /**
     * 更新供应状态
     */
    private void updateSupplyStatus(Integer supplyId, String status) {
        supplyMapper.updateStatus(supplyId, status);
    }

    @Override
    @Transactional
    public Integer createConnection(SupplyConnectionCreateRequest request, User user) {
        // 参数校验：demandId 和 supplyId 必须有一个且只有一个
        if ((request.getDemandId() == null && request.getSupplyId() == null)
                || (request.getDemandId() != null && request.getSupplyId() != null)) {
            throw new BusinessException(400, "必须指定需求或供应之一，不能同时指定");
        }

        SupplyDemandVO demand = null;
        SupplySupplyVO supply = null;

        // 如果是需求方发起对接（查看某条需求，想要供应方来对接）
        if (request.getDemandId() != null) {
            demand = demandMapper.selectById(request.getDemandId());
            if (demand == null) {
                throw new BusinessException(404, "需求不存在");
            }
            if (user.getId().equals(demand.getUserId())) {
                throw new BusinessException(403, "不能对接自己发布的需求");
            }
            // 检查是否已向该需求发起过对接
            List<SupplyConnectionVO> existingForDemand = connectionMapper.findByDemandId(request.getDemandId());
            boolean hasDuplicate = existingForDemand.stream()
                    .anyMatch(c -> user.getId().equals(c.getApplicantUserId()) && "negotiating".equals(c.getStatus()));
            if (hasDuplicate) {
                throw new BusinessException(400, "您已向该需求发起过对接申请，请勿重复申请");
            }
        }

        // 如果是供应方发起对接（查看某条供应，想要需求方来对接）
        if (request.getSupplyId() != null) {
            supply = supplyMapper.selectById(request.getSupplyId());
            if (supply == null) {
                throw new BusinessException(404, "供应不存在");
            }
            if (user.getId().equals(supply.getUserId())) {
                throw new BusinessException(403, "不能对接自己发布的供应");
            }
            // 检查是否已向该供应发起过对接
            List<SupplyConnectionVO> existingForSupply = connectionMapper.findBySupplyId(request.getSupplyId());
            boolean hasDuplicate = existingForSupply.stream()
                    .anyMatch(c -> user.getId().equals(c.getApplicantUserId()) && "negotiating".equals(c.getStatus()));
            if (hasDuplicate) {
                throw new BusinessException(400, "您已向该供应发起过对接申请，请勿重复申请");
            }
        }

        // 生成对接编号：CN + yyyyMMdd + 3位序号
        String connectionId = generateConnectionId();

        // 构建对接记录实体
        SupplyConnection connection = new SupplyConnection();
        connection.setConnectionId(connectionId);
        connection.setDemandId(request.getDemandId());
        connection.setSupplyId(request.getSupplyId());
        // 回填供需双方的发布者ID，供后续权限校验和通知使用
        connection.setDemandUserId(demand != null ? demand.getUserId() : null);
        connection.setSupplyUserId(supply != null ? supply.getUserId() : null);
        connection.setStatus("negotiating");
        connection.setStartDate(LocalDate.now());
        connection.setLastUpdate(LocalDate.now());
        connection.setNotes(request.getNotes());
        // 回填申请方信息（从已认证的用户对象获取）
        connection.setApplicantUserId(user.getId());
        connection.setApplicantCompanyName(
                str(user.getEnterpriseName()) ? user.getEnterpriseName() : null);
        connection.setApplicantContactName(
                str(user.getNickname()) ? user.getNickname() : null);
        connection.setApplicantContactPhone(
                str(user.getEnterprisePhone()) ? user.getEnterprisePhone() : null);
        connection.setApplicantContactEmail(
                str(user.getEmail()) ? user.getEmail() : null);
        connection.setCreatedAt(LocalDateTime.now());
        connection.setUpdatedAt(LocalDateTime.now());

        int result = connectionMapper.insert(connection);
        if (result <= 0) {
            throw new BusinessException(500, "创建对接记录失败");
        }

        // 联动更新关联的需求/供应状态
        if (demand != null && !"inprocess".equals(demand.getStatus()) && !"completed".equals(demand.getStatus())) {
            updateDemandStatus(demand.getId(), "inprocess");
        }
        if (supply != null && !"busy".equals(supply.getStatus()) && !"completed".equals(supply.getStatus())) {
            updateSupplyStatus(supply.getId(), "busy");
        }

        // ========== 发站内通知给被对接方 ==========
        // 找到被对接方的 userId（需求方或供应方的发布者）
        String targetUserId = null;
        String targetTitle = null;
        if (demand != null) {
            targetUserId = demand.getUserId();
            targetTitle = demand.getTitle();
        } else if (supply != null) {
            targetUserId = supply.getUserId();
            targetTitle = supply.getTitle();
        }
        if (targetUserId != null && !targetUserId.equals(user.getId())) {
            String notifTitle = "新的对接申请";
            String notifContent = String.format("「%s」向您发起了对接申请：%s",
                    str(user.getEnterpriseName()) ? user.getEnterpriseName() : user.getNickname(),
                    str(user.getEnterprisePhone()) ? "联系电话：" + user.getEnterprisePhone() : "请登录平台查看详情");
            notificationService.notify(
                    targetUserId,
                    "supply_connection_created",
                    notifTitle,
                    notifContent,
                    connection.getId(),
                    "connection"
            );
        }

        // ========== WebSocket 实时推送 ==========
        try {
            // 获取完整的对接信息用于推送
            SupplyConnectionVO fullConnection = connectionMapper.selectById(connection.getId());
            if (fullConnection != null) {
                // 推送给被对接方
                if (targetUserId != null) {
                    connectionPushService.pushNewConnection(targetUserId, fullConnection);
                }
                // 推送给自己（可选，用于刷新"我发出的"列表）
                connectionPushService.pushNewConnection(user.getId(), fullConnection);
            }
        } catch (Exception e) {
            // WebSocket 推送失败不影响业务，仅记录日志
            log.warn("【供需对接】WebSocket 推送失败: {}", e.getMessage());
        }

        return connection.getId();
    }

    /** 判断字符串是否非空 */
    private boolean str(String s) {
        return s != null && !s.trim().isEmpty();
    }

    @Override
    public SupplyConnectionVO getConnectionById(Integer id) {
        SupplyConnectionVO connection = connectionMapper.selectById(id);
        if (connection == null) {
            throw new BusinessException(404, "对接记录不存在");
        }
        return connection;
    }

    @Override
    public List<SupplyConnectionVO> getConnectionsByDemandId(Integer demandId) {
        return connectionMapper.findByDemandId(demandId);
    }

    @Override
    public List<SupplyConnectionVO> getConnectionsBySupplyId(Integer supplyId) {
        return connectionMapper.findBySupplyId(supplyId);
    }

    @Override
    public List<SupplyConnectionVO> getMyConnections(String userId) {
        return connectionMapper.findByUserId(userId);
    }

    @Override
    public List<MyPublishedItemVO> getMyPublishedItems(String userId) {
        List<MyPublishedItemVO> result = new ArrayList<>();

        // 获取用户发布的需求
        List<SupplyDemandVO> myDemands = demandMapper.findByUserId(userId);
        for (SupplyDemandVO demand : myDemands) {
            MyPublishedItemVO item = new MyPublishedItemVO();
            item.setId(demand.getId());
            item.setItemId(demand.getDemandId());
            item.setTitle(demand.getTitle());
            item.setType("demand");
            item.setCategory(demand.getCategory());
            item.setStatus(demand.getStatus());
            item.setCompanyName(demand.getCompanyName());
            item.setPublishDate(demand.getPublishDate());

            // 获取该需求的所有对接记录
            List<SupplyConnectionVO> connections = connectionMapper.findByDemandId(demand.getId());
            item.setTotalConnections(connections.size());
            item.setNegotiatingCount((int) connections.stream().filter(c -> "negotiating".equals(c.getStatus())).count());
            item.setCompletedCount((int) connections.stream().filter(c -> "completed".equals(c.getStatus())).count());

            // 映射对接记录
            item.setConnections(connections.stream().map(c -> {
                ConnectionRecordVO r = new ConnectionRecordVO();
                r.setId(c.getId());
                r.setConnectionId(c.getConnectionId());
                r.setStatus(c.getStatus());
                r.setStartDate(c.getStartDate() != null ? c.getStartDate().toString() : null);
                r.setLastUpdate(c.getLastUpdate() != null ? c.getLastUpdate().toString() : null);
                r.setCompletedDate(c.getCompletedDate() != null ? c.getCompletedDate().toString() : null);
                r.setNotes(c.getNotes());
                r.setApplicantUserId(c.getApplicantUserId());
                r.setApplicantCompanyName(c.getApplicantCompanyName());
                r.setApplicantContactName(c.getApplicantContactName());
                r.setApplicantContactPhone(c.getApplicantContactPhone());
                r.setApplicantContactEmail(c.getApplicantContactEmail());
                r.setCreatedAt(c.getCreatedAt());
                return r;
            }).collect(Collectors.toList()));

            result.add(item);
        }

        // 获取用户发布的供应
        List<SupplySupplyVO> mySupplies = supplyMapper.findByUserId(userId);
        for (SupplySupplyVO supply : mySupplies) {
            MyPublishedItemVO item = new MyPublishedItemVO();
            item.setId(supply.getId());
            item.setItemId(supply.getSupplyId());
            item.setTitle(supply.getTitle());
            item.setType("supply");
            item.setCategory(supply.getCategory());
            item.setStatus(supply.getStatus());
            item.setCompanyName(supply.getCompanyName());
            item.setPublishDate(supply.getPublishDate());

            // 获取该供应的所有对接记录
            List<SupplyConnectionVO> connections = connectionMapper.findBySupplyId(supply.getId());
            item.setTotalConnections(connections.size());
            item.setNegotiatingCount((int) connections.stream().filter(c -> "negotiating".equals(c.getStatus())).count());
            item.setCompletedCount((int) connections.stream().filter(c -> "completed".equals(c.getStatus())).count());

            // 映射对接记录
            item.setConnections(connections.stream().map(c -> {
                ConnectionRecordVO r = new ConnectionRecordVO();
                r.setId(c.getId());
                r.setConnectionId(c.getConnectionId());
                r.setStatus(c.getStatus());
                r.setStartDate(c.getStartDate() != null ? c.getStartDate().toString() : null);
                r.setLastUpdate(c.getLastUpdate() != null ? c.getLastUpdate().toString() : null);
                r.setCompletedDate(c.getCompletedDate() != null ? c.getCompletedDate().toString() : null);
                r.setNotes(c.getNotes());
                r.setApplicantUserId(c.getApplicantUserId());
                r.setApplicantCompanyName(c.getApplicantCompanyName());
                r.setApplicantContactName(c.getApplicantContactName());
                r.setApplicantContactPhone(c.getApplicantContactPhone());
                r.setApplicantContactEmail(c.getApplicantContactEmail());
                r.setCreatedAt(c.getCreatedAt());
                return r;
            }).collect(Collectors.toList()));

            result.add(item);
        }

        return result;
    }

    @Override
    @Transactional
    public boolean updateConnectionStatus(Integer id, String status, String userId) {
        SupplyConnectionVO existing = connectionMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "对接记录不存在");
        }

        // 校验权限：只有对接双方可以更新状态
        boolean isApplicant = userId.equals(existing.getApplicantUserId());
        boolean isDemandOwner = existing.getDemandUserId() != null && userId.equals(existing.getDemandUserId());
        boolean isSupplyOwner = existing.getSupplyUserId() != null && userId.equals(existing.getSupplyUserId());

        if (!isApplicant && !isDemandOwner && !isSupplyOwner) {
            throw new BusinessException(403, "无权更新此对接记录");
        }

        // 校验状态值
        if (!"negotiating".equals(status) && !"completed".equals(status) && !"cancelled".equals(status)) {
            throw new BusinessException(400, "无效的对接状态");
        }

        // 保存对接双方用户ID（用于后续通知），在状态更新之前获取
        String savedDemandUserId = existing.getDemandUserId();
        String savedSupplyUserId = existing.getSupplyUserId();
        String savedApplicantUserId = existing.getApplicantUserId();

        int result = connectionMapper.updateStatus(id, status);
        if (result <= 0) {
            return false;
        }

        // 如果状态变更为已完成或已取消，更新关联的需求/供应状态
        if ("completed".equals(status) || "cancelled".equals(status)) {
            // 检查该需求下是否还有其他洽谈中的对接
            if (existing.getDemandId() != null) {
                List<SupplyConnectionVO> demandConnections = connectionMapper.findByDemandId(existing.getDemandId());
                boolean hasNegotiating = demandConnections.stream()
                        .filter(c -> c.getId() != null && !c.getId().equals(id))
                        .anyMatch(c -> "negotiating".equals(c.getStatus()));
                if (!hasNegotiating) {
                    if ("completed".equals(status)) {
                        updateDemandStatus(existing.getDemandId(), "completed");
                    } else {
                        updateDemandStatus(existing.getDemandId(), "open");
                    }
                }
            }
            // 检查该供应下是否还有其他洽谈中的对接
            if (existing.getSupplyId() != null) {
                List<SupplyConnectionVO> supplyConnections = connectionMapper.findBySupplyId(existing.getSupplyId());
                boolean hasNegotiating = supplyConnections.stream()
                        .filter(c -> c.getId() != null && !c.getId().equals(id))
                        .anyMatch(c -> "negotiating".equals(c.getStatus()));
                if (!hasNegotiating) {
                    if ("completed".equals(status)) {
                        updateSupplyStatus(existing.getSupplyId(), "completed");
                    } else {
                        updateSupplyStatus(existing.getSupplyId(), "available");
                    }
                }
            }
        }

        // ========== 发站内通知给另一方 ==========
        // 通知目标判断：当前操作者如果是申请方，则通知需求/供应发布方；反之亦然
        String otherPartyId = null;
        if (userId.equals(savedApplicantUserId) && savedDemandUserId != null && !savedDemandUserId.equals(userId)) {
            otherPartyId = savedDemandUserId;
        } else if (userId.equals(savedApplicantUserId) && savedSupplyUserId != null && !savedSupplyUserId.equals(userId)) {
            otherPartyId = savedSupplyUserId;
        } else if (!userId.equals(savedApplicantUserId) && savedApplicantUserId != null) {
            otherPartyId = savedApplicantUserId;
        }
        if (otherPartyId != null) {
            String statusText = "completed".equals(status) ? "已完成" : "已取消";
            notificationService.notify(
                    otherPartyId,
                    "connection_status_changed",
                    "对接状态变更",
                    String.format("您的对接申请 #%s 状态已变更为「%s」",
                            existing.getConnectionId(), statusText),
                    id,
                    "connection"
            );
        }

        // ========== WebSocket 实时推送 ==========
        try {
            // 推送给另一方
            if (otherPartyId != null) {
                connectionPushService.pushStatusChanged(otherPartyId, id, status, existing.getConnectionId());
            }
            // 推送给自己
            connectionPushService.pushStatusChanged(userId, id, status, existing.getConnectionId());
        } catch (Exception e) {
            log.warn("【供需对接】WebSocket 状态变更推送失败: {}", e.getMessage());
        }

        return true;
    }

    @Override
    @Transactional
    public boolean deleteConnection(Integer id, String userId) {
        SupplyConnectionVO existing = connectionMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "对接记录不存在");
        }

        // 校验权限：只有申请方或发布方可以删除
        boolean isApplicant = userId.equals(existing.getApplicantUserId());
        boolean isDemandOwner = existing.getDemandUserId() != null && userId.equals(existing.getDemandUserId());
        boolean isSupplyOwner = existing.getSupplyUserId() != null && userId.equals(existing.getSupplyUserId());

        if (!isApplicant && !isDemandOwner && !isSupplyOwner) {
            throw new BusinessException(403, "无权删除此对接记录");
        }

        int result = connectionMapper.deleteById(id);

        // 删除后检查是否需要恢复关联的供需状态
        if (result > 0 && "negotiating".equals(existing.getStatus())) {
            if (existing.getDemandId() != null) {
                List<SupplyConnectionVO> demandConnections = connectionMapper.findByDemandId(existing.getDemandId());
                boolean hasNegotiating = demandConnections.stream()
                        .filter(c -> c.getId() != null && !c.getId().equals(id))
                        .anyMatch(c -> "negotiating".equals(c.getStatus()));
                if (!hasNegotiating) {
                    updateDemandStatus(existing.getDemandId(), "open");
                }
            }
            if (existing.getSupplyId() != null) {
                List<SupplyConnectionVO> supplyConnections = connectionMapper.findBySupplyId(existing.getSupplyId());
                boolean hasNegotiating = supplyConnections.stream()
                        .filter(c -> c.getId() != null && !c.getId().equals(id))
                        .anyMatch(c -> "negotiating".equals(c.getStatus()));
                if (!hasNegotiating) {
                    updateSupplyStatus(existing.getSupplyId(), "available");
                }
            }
        }

        return result > 0;
    }

    /**
     * 生成对接编号：CN + 年月日 + 6位随机数（避免时间戳冲突）
     */
    private String generateConnectionId() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%06d", (int) (Math.random() * 999999));
        return "CN" + dateStr + seq;
    }
}
