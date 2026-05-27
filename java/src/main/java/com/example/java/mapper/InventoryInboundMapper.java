package com.example.java.mapper;

import com.example.java.dto.InventoryInboundVO;
import com.example.java.entity.InventoryInboundRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface InventoryInboundMapper {
    List<InventoryInboundVO> findAll(@Param("status") String status);
    InventoryInboundVO selectById(Integer id);
    InventoryInboundRecord selectEntityById(Integer id);
    int insert(InventoryInboundRecord record);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int deleteById(Integer id);
    int countByStatus(@Param("status") String status);
    int countToday();
}
