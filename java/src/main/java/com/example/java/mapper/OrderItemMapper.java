package com.example.java.mapper;

import com.example.java.dto.OrderItemVO;
import com.example.java.entity.OrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderItemMapper {
    void insert(OrderItem orderItem);
    void insertBatch(@Param("items") List<OrderItem> items);
    List<OrderItemVO> selectByOrderId(@Param("orderId") String orderId);
}
