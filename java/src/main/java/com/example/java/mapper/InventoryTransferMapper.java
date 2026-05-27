package com.example.java.mapper;

import com.example.java.dto.InventoryTransferVO;
import com.example.java.entity.InventoryTransferRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface InventoryTransferMapper {
    List<InventoryTransferVO> findAll(@Param("status") String status);
    InventoryTransferVO selectById(Integer id);
    InventoryTransferRecord selectEntityById(Integer id);
    int insert(InventoryTransferRecord record);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int deleteById(Integer id);
}
