package com.example.java.service;

import com.example.java.dto.WorkOrderCreateRequest;
import com.example.java.dto.WorkOrderReplyRequest;
import com.example.java.entity.WorkOrder;
import com.example.java.entity.WorkOrderMessage;

import java.util.List;
import java.util.Map;

/**
 * 工单服务
 */
public interface WorkOrderService {

    /** 创建工单，返回新建的工单 */
    WorkOrder create(String userId, WorkOrderCreateRequest request);

    /** 当前用户的工单列表 */
    List<WorkOrder> listByUserId(String userId);

    /** 管理员：全部工单列表 */
    List<WorkOrder> listAll();

    /** 工单详情（含消息列表），校验本人或管理员 */
    WorkOrder getDetail(String orderId, String userId, boolean isAdmin);

    /** 回复工单，返回 { time } 供前端使用 */
    Map<String, String> reply(String orderId, String userId, boolean isAdmin, WorkOrderReplyRequest request);

    /** 关闭工单（仅本人可关闭） */
    void close(String orderId, String userId);
}
