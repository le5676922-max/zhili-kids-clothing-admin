package com.example.java.mapper;

import com.example.java.dto.InventorySupplierVO;
import com.example.java.entity.InventorySupplier;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface InventorySupplierMapper {
    List<InventorySupplierVO> findAll();
    InventorySupplierVO selectById(Integer id);
    InventorySupplier selectEntityById(Integer id);
    int insert(InventorySupplier supplier);
    int update(InventorySupplier supplier);
    int deleteById(Integer id);
    int countTotal();
}
