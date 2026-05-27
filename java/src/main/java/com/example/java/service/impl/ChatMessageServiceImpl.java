package com.example.java.service.impl;

import com.example.java.dto.ChatContactVO;
import com.example.java.dto.ChatMessageVO;
import com.example.java.dto.SupplyConnectionVO;
import com.example.java.entity.ChatMessage;
import com.example.java.entity.JobPosition;
import com.example.java.entity.User;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.ChatMessageMapper;
import com.example.java.mapper.SupplyConnectionMapper;
import com.example.java.mapper.UserMapper;
import com.example.java.service.ChatMessageService;
import com.example.java.service.JobPositionService;
import com.example.java.util.HtmlEscapeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageMapper chatMessageMapper;
    private final UserMapper userMapper;
    private final JobPositionService jobPositionService;
    private final SupplyConnectionMapper supplyConnectionMapper;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public ChatMessageVO send(String senderId, String receiverId, Integer jobId,
                               Integer connectionId, String content) {
        if (content == null) content = "";
        String trimmed = content.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException(400, "消息内容不能为空");
        }
        if (trimmed.length() > 2000) {
            throw new BusinessException(400, "消息内容过长，最多2000个字符");
        }
        content = HtmlEscapeUtils.escapeAndStrip(trimmed);
        if (receiverId == null || receiverId.isEmpty()) {
            throw new BusinessException(400, "接收人不能为空");
        }
        if (senderId.equals(receiverId)) {
            throw new BusinessException(400, "不能给自己发消息");
        }
        User receiver = userMapper.findById(receiverId);
        if (receiver == null) {
            throw new BusinessException(400, "接收方用户不存在");
        }
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setReceiverId(receiverId);
        msg.setJobId(jobId);
        msg.setConnectionId(connectionId);
        msg.setContent(content);
        chatMessageMapper.insert(msg);
        ChatMessage persisted = msg.getId() != null
                ? chatMessageMapper.selectById(msg.getId()) : msg;
        if (persisted == null) persisted = msg;
        ChatMessageVO vo = toVO(persisted, senderId);
        if (connectionId != null) {
            SupplyConnectionVO conn = supplyConnectionMapper.selectById(connectionId);
            if (conn != null) vo.setConnectionCode(conn.getConnectionId());
        }
        vo.setFromMe(true);
        return vo;
    }

    @Override
    public void saveMessage(String senderId, String receiverId, Integer jobId,
                             Integer connectionId, String content) {
        if (content == null || content.trim().isEmpty()) return;
        // XSS 防护：内容转义 + 超长截断（聊天消息限制 2000 字）
        String safeContent = HtmlEscapeUtils.truncateAndEscape(content.trim(), 2000);
        if (safeContent.isEmpty()) return;
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setReceiverId(receiverId != null ? receiverId : "");
        msg.setJobId(jobId);
        msg.setConnectionId(connectionId);
        msg.setContent(safeContent);
        chatMessageMapper.insert(msg);
    }

    @Override
    public List<ChatContactVO> listContacts(String userId) {
        List<String> otherIds = chatMessageMapper.selectContactUserIds(userId);
        List<ChatContactVO> list = new ArrayList<>();
        for (String otherId : otherIds) {
            ChatMessage latest = chatMessageMapper.selectLatestBetween(userId, otherId, null);
            if (latest == null) continue;
            User other = userMapper.findById(otherId);
            ChatContactVO vo = new ChatContactVO();
            vo.setOtherUserId(otherId);
            vo.setOtherNickname(other != null
                    ? (other.getNickname() != null ? other.getNickname() : other.getEmail())
                    : "用户");
            vo.setOtherAvatar(other != null ? other.getAvatar() : null);
            vo.setJobId(latest.getJobId());
            vo.setConnectionId(latest.getConnectionId());
            vo.setJobName(null);
            if (latest.getJobId() != null) {
                JobPosition job = jobPositionService.getPositionById(latest.getJobId());
                if (job != null) vo.setJobName(job.getJobName());
            }
            if (latest.getConnectionId() != null) {
                SupplyConnectionVO conn = supplyConnectionMapper.selectById(latest.getConnectionId());
                if (conn != null) {
                    vo.setConnectionCode(conn.getConnectionId());
                    String otherPartyName = conn.getApplicantUserId() != null
                            && !conn.getApplicantUserId().equals(userId)
                            ? conn.getApplicantCompanyName() : null;
                    vo.setConnectionTitle(conn.getDemandTitle() != null
                            ? conn.getDemandTitle() : conn.getSupplyTitle());
                }
            }
            vo.setLastContent(latest.getContent());
            vo.setLastTime(latest.getCreatedAt());
            vo.setUnreadCount(chatMessageMapper.countUnreadBetween(userId, otherId, latest.getJobId()));
            list.add(vo);
        }
        return list;
    }

    @Override
    public List<ChatMessageVO> listHistory(String userId, String otherUserId,
                                            Integer jobId, Integer connectionId) {
        if (connectionId != null) {
            return listByConnectionId(userId, connectionId);
        }
        List<ChatMessage> messages = chatMessageMapper
                .selectConversation(userId, otherUserId, jobId, 500);
        return messages.stream()
                .map(m -> toVO(m, userId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ChatMessageVO> listByConnectionId(String userId, Integer connectionId) {
        List<ChatMessage> messages = chatMessageMapper
                .selectByConnectionId(connectionId, 500);
        SupplyConnectionVO conn = supplyConnectionMapper.selectById(connectionId);
        String connCode = conn != null ? conn.getConnectionId() : null;
        return messages.stream()
                .map(m -> {
                    ChatMessageVO vo = toVO(m, userId);
                    vo.setConnectionId(connectionId);
                    vo.setConnectionCode(connCode);
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    public int getUnreadCount(String userId) {
        return chatMessageMapper.countUnreadByReceiver(userId);
    }

    @Override
    public int getUnreadCountBetween(String userId, String otherUserId, Integer jobId) {
        return chatMessageMapper.countUnreadBetween(userId, otherUserId, jobId);
    }

    @Override
    public void markAsRead(String userId, String otherUserId, Integer jobId, Integer connectionId) {
        chatMessageMapper.updateReadAtByReceiver(userId, otherUserId, jobId, connectionId);
    }

    @Override
    public void markConnectionAsRead(String userId, Integer connectionId) {
        chatMessageMapper.updateReadAtByReceiver(userId, null, null, connectionId);
    }

    private ChatMessageVO toVO(ChatMessage m, String currentUserId) {
        ChatMessageVO vo = new ChatMessageVO();
        vo.setId(m.getId());
        vo.setSenderId(m.getSenderId());
        vo.setReceiverId(m.getReceiverId());
        vo.setJobId(m.getJobId());
        vo.setConnectionId(m.getConnectionId());
        vo.setContent(m.getContent());
        vo.setCreatedAt(m.getCreatedAt());
        vo.setFromMe(m.getSenderId().equals(currentUserId));
        return vo;
    }
}
