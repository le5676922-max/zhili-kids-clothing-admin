package com.example.java.mapper;

import com.example.java.dto.InventoryProductVO;
import com.example.java.entity.InventoryProduct;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface InventoryProductMapper {
    List<InventoryProductVO> findAll(@Param("keyword") String keyword,
                                     @Param("category") String category,
                                     @Param("warehouseId") Integer warehouseId);
    List<InventoryProductVO> findLowStock();
    InventoryProductVO selectById(Integer id);
    InventoryProduct selectEntityById(Integer id);
    int insert(InventoryProduct product);
    int update(InventoryProduct product);
    int deleteById(Integer id);
    int incrementStock(@Param("id") Integer id, @Param("quantity") Integer quantity);
    int decrementStock(@Param("id") Integer id, @Param("quantity") Integer quantity);
    int countByWarehouseId(Integer warehouseId);
    int countBySupplierId(Integer supplierId);
    int countTotal();
    int countLowStock();
}
