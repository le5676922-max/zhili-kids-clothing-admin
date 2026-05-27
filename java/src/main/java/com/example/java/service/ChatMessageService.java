package com.example.java.service;

import com.example.java.dto.ChatContactVO;
import com.example.java.dto.ChatMessageVO;

import java.util.List;

public interface ChatMessageService {

    /**
     * 发送消息并落库（REST API 调用，需完整校验）
     * @param connectionId 供需对接ID（可选，招聘场景为 null）
     */
    ChatMessageVO send(String senderId, String receiverId, Integer jobId, Integer connectionId, String content);

    /**
     * 保存聊天记录（WebSocket 调用，仅落库，不做业务校验）
     */
    void saveMessage(String senderId, String receiverId, Integer jobId, Integer connectionId, String content);

    /**
     * 当前用户的联系人列表（含最近一条消息、关联职位/对接）
     */
    List<ChatContactVO> listContacts(String userId);

    /**
     * 与某人的聊天历史
     * @param jobId        职位ID（招聘场景）
     * @param connectionId 供需对接ID（企业间对接场景）
     */
    List<ChatMessageVO> listHistory(String userId, String otherUserId, Integer jobId, Integer connectionId);

    /**
     * 按供需对接ID获取聊天记录
     */
    List<ChatMessageVO> listByConnectionId(String userId, Integer connectionId);

    /**
     * 当前用户未读消息数量（招聘 + 供需）
     */
    int getUnreadCount(String userId);

    /**
     * 与某联系人的未读消息数
     */
    int getUnreadCountBetween(String userId, String otherUserId, Integer jobId);

    /**
     * 将与某人的会话标记为已读
     */
    void markAsRead(String userId, String otherUserId, Integer jobId, Integer connectionId);

    /**
     * 将某对接的所有消息标记为已读
     */
    void markConnectionAsRead(String userId, Integer connectionId);
}
