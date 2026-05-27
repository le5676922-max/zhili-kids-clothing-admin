package com.example.java.mapper;

import com.example.java.dto.InventoryWarehouseVO;
import com.example.java.entity.InventoryWarehouse;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface InventoryWarehouseMapper {
    List<InventoryWarehouseVO> findAll();
    InventoryWarehouseVO selectById(Integer id);
    InventoryWarehouse selectEntityById(Integer id);
    int insert(InventoryWarehouse warehouse);
    int update(InventoryWarehouse warehouse);
    int deleteById(Integer id);
    int countTotal();
}
