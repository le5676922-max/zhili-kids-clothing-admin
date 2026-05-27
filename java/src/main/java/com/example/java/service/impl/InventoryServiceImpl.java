package com.example.java.service.impl;

import com.example.java.dto.*;
import com.example.java.entity.*;
import com.example.java.mapper.*;
import com.example.java.service.InventoryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryServiceImpl implements InventoryService {

    @Autowired
    private InventoryProductMapper productMapper;

    @Autowired
    private InventoryWarehouseMapper warehouseMapper;

    @Autowired
    private InventorySupplierMapper supplierMapper;

    @Autowired
    private InventoryInboundMapper inboundMapper;

    @Autowired
    private InventoryOutboundMapper outboundMapper;

    @Autowired
    private InventoryTransferMapper transferMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_APPROVED = "approved";
    private static final String STATUS_COMPLETED = "completed";
    private static final String STATUS_CANCELLED = "cancelled";
    private static final String STATUS_REJECTED = "rejected";

    @Override
    public List<InventoryProductVO> listProducts(String keyword, String category, Integer warehouseId) {
        List<InventoryProductVO> list = productMapper.findAll(keyword, category, warehouseId);
        for (InventoryProductVO vo : list) {
            vo.setLowStock(vo.getMinStock() != null && vo.getMinStock() > 0 && vo.getStock() <= vo.getMinStock());
        }
        return list;
    }

    @Override
    public List<InventoryProductVO> listLowStockProducts() {
        return productMapper.findLowStock();
    }

    @Override
    public InventoryProductVO getProductById(Integer id) {
        return productMapper.selectById(id);
    }

    @Override
    public int createProduct(InventoryProductCreateRequest request) {
        InventoryProduct entity = new InventoryProduct();
        entity.setProductCode(request.getProductCode());
        entity.setName(request.getName());
        entity.setSpec(request.getSpec());
        entity.setCategory(request.getCategory());
        entity.setUnit(request.getUnit());
        entity.setPrice(request.getPrice());
        entity.setStock(request.getStock() != null ? request.getStock() : 0);
        entity.setMinStock(request.getMinStock() != null ? request.getMinStock() : 0);
        entity.setWarehouseId(request.getWarehouseId());
        entity.setSupplierId(request.getSupplierId());
        entity.setRemark(request.getRemark());
        return productMapper.insert(entity);
    }

    @Override
    public int updateProduct(Integer id, InventoryProductCreateRequest request) {
        InventoryProduct entity = productMapper.selectEntityById(id);
        if (entity == null) return 0;
        entity.setName(request.getName());
        entity.setSpec(request.getSpec());
        entity.setCategory(request.getCategory());
        entity.setUnit(request.getUnit());
        entity.setPrice(request.getPrice());
        // 不允许通过更新产品接口直接修改库存，库存只能通过出入库流程变更
        entity.setMinStock(request.getMinStock());
        entity.setWarehouseId(request.getWarehouseId());
        entity.setSupplierId(request.getSupplierId());
        entity.setRemark(request.getRemark());
        return productMapper.update(entity);
    }

    @Override
    public int deleteProduct(Integer id) {
        return productMapper.deleteById(id);
    }

    // ==================== 仓库 ====================

    @Override
    public List<InventoryWarehouseVO> listWarehouses() {
        return warehouseMapper.findAll();
    }

    @Override
    public InventoryWarehouseVO getWarehouseById(Integer id) {
        return warehouseMapper.selectById(id);
    }

    @Override
    public int createWarehouse(InventoryWarehouseVO vo) {
        InventoryWarehouse entity = new InventoryWarehouse();
        entity.setName(vo.getName());
        entity.setAddress(vo.getAddress());
        entity.setManager(vo.getManager());
        entity.setContactPhone(vo.getContactPhone());
        entity.setCapacity(vo.getCapacity());
        entity.setStatus(vo.getStatus() != null ? vo.getStatus() : 1);
        return warehouseMapper.insert(entity);
    }

    @Override
    public int updateWarehouse(Integer id, InventoryWarehouseVO vo) {
        InventoryWarehouse entity = warehouseMapper.selectEntityById(id);
        if (entity == null) return 0;
        entity.setName(vo.getName());
        entity.setAddress(vo.getAddress());
        entity.setManager(vo.getManager());
        entity.setContactPhone(vo.getContactPhone());
        entity.setCapacity(vo.getCapacity());
        entity.setStatus(vo.getStatus());
        return warehouseMapper.update(entity);
    }

    @Override
    public int deleteWarehouse(Integer id) {
        return warehouseMapper.deleteById(id);
    }

    // ==================== 供应商 ====================

    @Override
    public List<InventorySupplierVO> listSuppliers() {
        return supplierMapper.findAll();
    }

    @Override
    public InventorySupplierVO getSupplierById(Integer id) {
        return supplierMapper.selectById(id);
    }

    @Override
    public int createSupplier(InventorySupplierVO vo) {
        InventorySupplier entity = new InventorySupplier();
        entity.setName(vo.getName());
        entity.setContactPerson(vo.getContactPerson());
        entity.setContactPhone(vo.getContactPhone());
        entity.setAddress(vo.getAddress());
        entity.setStatus(vo.getStatus() != null ? vo.getStatus() : 1);
        return supplierMapper.insert(entity);
    }

    @Override
    public int updateSupplier(Integer id, InventorySupplierVO vo) {
        InventorySupplier entity = supplierMapper.selectEntityById(id);
        if (entity == null) return 0;
        entity.setName(vo.getName());
        entity.setContactPerson(vo.getContactPerson());
        entity.setContactPhone(vo.getContactPhone());
        entity.setAddress(vo.getAddress());
        entity.setStatus(vo.getStatus());
        return supplierMapper.update(entity);
    }

    @Override
    public int deleteSupplier(Integer id) {
        return supplierMapper.deleteById(id);
    }

    // ==================== 入库 ====================

    @Override
    public List<InventoryInboundVO> listInboundRecords(String status) {
        return inboundMapper.findAll(status);
    }

    @Override
    public InventoryInboundVO getInboundRecordById(Integer id) {
        return inboundMapper.selectById(id);
    }

    @Override
    @Transactional
    public int createInboundRecord(InventoryInboundCreateRequest request) {
        try {
            String productsJson = objectMapper.writeValueAsString(request.getProducts());
            String recordNo = generateRecordNo("RK");
            InventoryInboundRecord record = new InventoryInboundRecord();
            record.setRecordNo(recordNo);
            record.setInboundDate(request.getInboundDate() != null ? request.getInboundDate() : LocalDate.now());
            record.setSupplierId(request.getSupplierId());
            record.setWarehouseId(request.getWarehouseId());
            record.setProducts(productsJson);
            record.setTotalAmount(request.getTotalAmount() != null ? request.getTotalAmount() : BigDecimal.ZERO);
            record.setStatus(STATUS_PENDING);
            record.setOperator(request.getOperator());
            record.setRemark(request.getRemark());
            // 仅创建记录，不立即变更库存。审核通过后再增加库存。
            return inboundMapper.insert(record);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON序列化失败", e);
        }
    }

    @Override
    @Transactional
    public int updateInboundStatus(Integer id, String status) {
        InventoryInboundRecord record = inboundMapper.selectEntityById(id);
        if (record == null) return 0;

        String oldStatus = record.getStatus();
        boolean wasApplied = isAppliedStatus(oldStatus);
        boolean willApply = isAppliedStatus(status);

        // 从待审核变为已通过/已完成 → 应用库存变更
        if (!wasApplied && willApply) {
            applyInboundStock(record);
        }
        // 从已通过/已完成变为已取消/已拒绝 → 回滚库存变更
        if (wasApplied && !willApply) {
            revertInboundStock(record);
        }

        return inboundMapper.updateStatus(id, status);
    }

    @Override
    @Transactional
    public int deleteInboundRecord(Integer id) {
        InventoryInboundRecord record = inboundMapper.selectEntityById(id);
        if (record != null && isAppliedStatus(record.getStatus())) {
            revertInboundStock(record);
        }
        return inboundMapper.deleteById(id);
    }

    // ==================== 出库 ====================

    @Override
    public List<InventoryOutboundVO> listOutboundRecords(String status, String type) {
        return outboundMapper.findAll(status, type);
    }

    @Override
    public InventoryOutboundVO getOutboundRecordById(Integer id) {
        return outboundMapper.selectById(id);
    }

    @Override
    @Transactional
    public int createOutboundRecord(InventoryOutboundCreateRequest request) {
        try {
            String productsJson = objectMapper.writeValueAsString(request.getProducts());
            String recordNo = generateRecordNo("CK");
            InventoryOutboundRecord record = new InventoryOutboundRecord();
            record.setRecordNo(recordNo);
            record.setOutboundDate(request.getOutboundDate() != null ? request.getOutboundDate() : LocalDate.now());
            record.setType(request.getType());
            record.setWarehouseId(request.getWarehouseId());
            record.setTargetName(request.getTargetName());
            record.setProducts(productsJson);
            record.setStatus(STATUS_PENDING);
            record.setOperator(request.getOperator());
            record.setRemark(request.getRemark());
            // 仅创建记录，不立即变更库存。审核通过后再扣减库存。
            return outboundMapper.insert(record);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON序列化失败", e);
        }
    }

    @Override
    @Transactional
    public int updateOutboundStatus(Integer id, String status) {
        InventoryOutboundRecord record = outboundMapper.selectEntityById(id);
        if (record == null) return 0;

        String oldStatus = record.getStatus();
        boolean wasApplied = isAppliedStatus(oldStatus);
        boolean willApply = isAppliedStatus(status);

        if (!wasApplied && willApply) {
            applyOutboundStock(record);
        }
        if (wasApplied && !willApply) {
            revertOutboundStock(record);
        }

        return outboundMapper.updateStatus(id, status);
    }

    @Override
    @Transactional
    public int deleteOutboundRecord(Integer id) {
        InventoryOutboundRecord record = outboundMapper.selectEntityById(id);
        if (record != null && isAppliedStatus(record.getStatus())) {
            revertOutboundStock(record);
        }
        return outboundMapper.deleteById(id);
    }

    // ==================== 调拨 ====================

    @Override
    public List<InventoryTransferVO> listTransferRecords(String status) {
        return transferMapper.findAll(status);
    }

    @Override
    public InventoryTransferVO getTransferRecordById(Integer id) {
        return transferMapper.selectById(id);
    }

    @Override
    @Transactional
    public int createTransferRecord(InventoryTransferCreateRequest request) {
        try {
            String productsJson = objectMapper.writeValueAsString(request.getProducts());
            String recordNo = generateRecordNo("DB");
            InventoryTransferRecord record = new InventoryTransferRecord();
            record.setRecordNo(recordNo);
            record.setTransferDate(request.getTransferDate() != null ? request.getTransferDate() : LocalDate.now());
            record.setFromWarehouseId(request.getFromWarehouseId());
            record.setToWarehouseId(request.getToWarehouseId());
            record.setProducts(productsJson);
            record.setReason(request.getReason() != null ? request.getReason() : "balance");
            record.setStatus(STATUS_PENDING);
            record.setOperator(request.getOperator());
            record.setRemark(request.getRemark());
            // 仅创建记录，审核通过后才移动库存
            return transferMapper.insert(record);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON序列化失败", e);
        }
    }

    @Override
    @Transactional
    public int updateTransferStatus(Integer id, String status) {
        InventoryTransferRecord record = transferMapper.selectEntityById(id);
        if (record == null) return 0;

        String oldStatus = record.getStatus();
        boolean wasCompleted = STATUS_COMPLETED.equals(oldStatus);
        boolean willComplete = STATUS_COMPLETED.equals(status);

        if (!wasCompleted && willComplete) {
            applyTransferStock(record);
        }
        if (wasCompleted && !willComplete) {
            revertTransferStock(record);
        }

        return transferMapper.updateStatus(id, status);
    }

    @Override
    @Transactional
    public int deleteTransferRecord(Integer id) {
        InventoryTransferRecord record = transferMapper.selectEntityById(id);
        if (record != null && STATUS_COMPLETED.equals(record.getStatus())) {
            revertTransferStock(record);
        }
        return transferMapper.deleteById(id);
    }

    // ==================== 统计 ====================

    @Override
    public InventoryStatsVO getStats() {
        InventoryStatsVO stats = new InventoryStatsVO();
        stats.setTotalProducts(productMapper.countTotal());
        stats.setLowStockCount(productMapper.countLowStock());
        stats.setTotalWarehouses(warehouseMapper.countTotal());
        stats.setTotalSuppliers(supplierMapper.countTotal());
        stats.setPendingInboundCount(inboundMapper.countByStatus(STATUS_PENDING));
        stats.setPendingOutboundCount(outboundMapper.countByStatus(STATUS_PENDING));
        stats.setTodayInboundCount(inboundMapper.countToday());
        stats.setTodayOutboundCount(outboundMapper.countToday());
        return stats;
    }

    // ==================== 私有工具方法 ====================

    private boolean isAppliedStatus(String status) {
        return STATUS_APPROVED.equals(status) || STATUS_COMPLETED.equals(status);
    }

    private List<InventoryItemVO> parseProducts(String productsJson) {
        if (productsJson == null || productsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(productsJson, new TypeReference<List<InventoryItemVO>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("解析产品列表失败", e);
        }
    }

    private void applyInboundStock(InventoryInboundRecord record) {
        for (InventoryItemVO item : parseProducts(record.getProducts())) {
            productMapper.incrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private void revertInboundStock(InventoryInboundRecord record) {
        for (InventoryItemVO item : parseProducts(record.getProducts())) {
            productMapper.decrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private void applyOutboundStock(InventoryOutboundRecord record) {
        for (InventoryItemVO item : parseProducts(record.getProducts())) {
            productMapper.decrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private void revertOutboundStock(InventoryOutboundRecord record) {
        for (InventoryItemVO item : parseProducts(record.getProducts())) {
            productMapper.incrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private void applyTransferStock(InventoryTransferRecord record) {
        for (InventoryItemVO item : parseProducts(record.getProducts())) {
            productMapper.decrementStock(item.getProductId(), item.getQuantity());
            // 调拨：从源仓库扣减后，目标仓库增加（同一个 productId 对应相同产品，仓库信息在 record 中）
            productMapper.incrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private void revertTransferStock(InventoryTransferRecord record) {
        for (InventoryItemVO item : parseProducts(record.getProducts())) {
            productMapper.incrementStock(item.getProductId(), item.getQuantity());
            productMapper.decrementStock(item.getProductId(), item.getQuantity());
        }
    }

    private String generateRecordNo(String prefix) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuidPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return prefix + datePart + uuidPart;
    }
}
