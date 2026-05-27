package com.example.java.mapper;

import com.example.java.dto.InventoryOutboundVO;
import com.example.java.entity.InventoryOutboundRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface InventoryOutboundMapper {
    List<InventoryOutboundVO> findAll(@Param("status") String status, @Param("type") String type);
    InventoryOutboundVO selectById(Integer id);
    InventoryOutboundRecord selectEntityById(Integer id);
    int insert(InventoryOutboundRecord record);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int deleteById(Integer id);
    int countByStatus(@Param("status") String status);
    int countToday();
}
