package com.example.java.service;

import com.example.java.dto.*;
import java.util.List;

public interface InventoryService {
    List<InventoryProductVO> listProducts(String keyword, String category, Integer warehouseId);
    List<InventoryProductVO> listLowStockProducts();
    InventoryProductVO getProductById(Integer id);
    int createProduct(InventoryProductCreateRequest request);
    int updateProduct(Integer id, InventoryProductCreateRequest request);
    int deleteProduct(Integer id);

    List<InventoryWarehouseVO> listWarehouses();
    InventoryWarehouseVO getWarehouseById(Integer id);
    int createWarehouse(InventoryWarehouseVO vo);
    int updateWarehouse(Integer id, InventoryWarehouseVO vo);
    int deleteWarehouse(Integer id);

    List<InventorySupplierVO> listSuppliers();
    InventorySupplierVO getSupplierById(Integer id);
    int createSupplier(InventorySupplierVO vo);
    int updateSupplier(Integer id, InventorySupplierVO vo);
    int deleteSupplier(Integer id);

    List<InventoryInboundVO> listInboundRecords(String status);
    InventoryInboundVO getInboundRecordById(Integer id);
    int createInboundRecord(InventoryInboundCreateRequest request);
    int updateInboundStatus(Integer id, String status);
    int deleteInboundRecord(Integer id);

    List<InventoryOutboundVO> listOutboundRecords(String status, String type);
    InventoryOutboundVO getOutboundRecordById(Integer id);
    int createOutboundRecord(InventoryOutboundCreateRequest request);
    int updateOutboundStatus(Integer id, String status);
    int deleteOutboundRecord(Integer id);

    List<InventoryTransferVO> listTransferRecords(String status);
    InventoryTransferVO getTransferRecordById(Integer id);
    int createTransferRecord(InventoryTransferCreateRequest request);
    int updateTransferStatus(Integer id, String status);
    int deleteTransferRecord(Integer id);

    InventoryStatsVO getStats();
}
