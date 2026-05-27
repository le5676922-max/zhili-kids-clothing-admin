package com.example.java.mapper;

import com.example.java.entity.WorkOrder;
import com.example.java.entity.WorkOrderMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 工单 Mapper
 */
@Mapper
public interface WorkOrderMapper {

    int insert(WorkOrder order);

    WorkOrder findById(@Param("id") String id);

    List<WorkOrder> findByUserId(@Param("userId") String userId);

    List<WorkOrder> findAll();

    int insertMessage(WorkOrderMessage msg);

    List<WorkOrderMessage> findMessagesByOrderId(@Param("orderId") String orderId);

    int updateLastReply(@Param("id") String id, @Param("lastReply") String lastReply);

    int updateStatus(@Param("id") String id, @Param("status") String status);
}
