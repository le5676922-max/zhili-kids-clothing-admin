package com.example.java.mapper;

import com.example.java.dto.NotificationVO;
import com.example.java.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {

    int insert(Notification notification);

    /** 查询某用户所有通知（按时间倒序） */
    List<NotificationVO> selectByUserId(@Param("userId") String userId);

    /** 查询某用户未读通知数量 */
    int countUnread(@Param("userId") String userId);

    /** 标记单条通知为已读（校验归属用户） */
    int markAsRead(@Param("id") Long id, @Param("userId") String userId);

    /** 标记某用户所有通知为已读 */
    int markAllAsRead(@Param("userId") String userId);
}
