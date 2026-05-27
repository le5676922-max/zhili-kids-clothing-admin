package com.example.java.mapper;

import com.example.java.entity.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatMessageMapper {

    int insert(ChatMessage message);

    ChatMessage selectById(@Param("id") Long id);

    List<ChatMessage> selectConversation(
            @Param("user1") String user1,
            @Param("user2") String user2,
            @Param("jobId") Integer jobId,
            @Param("limit") int limit
    );

    /** 与我聊过天的用户ID列表（去重，按最近消息时间排序） */
    List<String> selectContactUserIds(@Param("userId") String userId);

    /** 与某人的最近一条消息（用于联系人列表展示） */
    ChatMessage selectLatestBetween(
            @Param("user1") String user1,
            @Param("user2") String user2,
            @Param("jobId") Integer jobId
    );

    /** 当前用户作为接收方的未读消息数 */
    int countUnreadByReceiver(@Param("receiverId") String receiverId);

    /** 将某会话中"对方发给我"的消息标记为已读 */
    int updateReadAtByReceiver(
            @Param("receiverId") String receiverId,
            @Param("otherUserId") String otherUserId,
            @Param("jobId") Integer jobId,
            @Param("connectionId") Integer connectionId
    );

    /** 按供需对接ID查询会话消息 */
    List<ChatMessage> selectByConnectionId(
            @Param("connectionId") Integer connectionId,
            @Param("limit") Integer limit
    );

    /** 统计某对接的未读消息数 */
    int countUnreadByConnection(
            @Param("connectionId") Integer connectionId,
            @Param("receiverId") String receiverId
    );

    /** 与某联系人之间的未读消息数 */
    int countUnreadBetween(
            @Param("userId") String userId,
            @Param("otherUserId") String otherUserId,
            @Param("jobId") Integer jobId
    );
}
