package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.*;
import com.example.java.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/stats")
    public R<InventoryStatsVO> getStats() {
        return R.success(inventoryService.getStats());
    }

    @GetMapping("/products")
    public R<List<InventoryProductVO>> listProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer warehouseId) {
        return R.success(inventoryService.listProducts(keyword, category, warehouseId));
    }

    @GetMapping("/products/low-stock")
    public R<List<InventoryProductVO>> listLowStockProducts() {
        return R.success(inventoryService.listLowStockProducts());
    }

    @GetMapping("/products/{id}")
    public R<InventoryProductVO> getProductById(@PathVariable Integer id) {
        return R.success(inventoryService.getProductById(id));
    }

    @PostMapping("/products")
    public R<Integer> createProduct(@RequestBody InventoryProductCreateRequest request) {
        return R.success(inventoryService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    public R<Integer> updateProduct(@PathVariable Integer id, @RequestBody InventoryProductCreateRequest request) {
        return R.success(inventoryService.updateProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    public R<Integer> deleteProduct(@PathVariable Integer id) {
        return R.success(inventoryService.deleteProduct(id));
    }

    @GetMapping("/warehouses")
    public R<List<InventoryWarehouseVO>> listWarehouses() {
        return R.success(inventoryService.listWarehouses());
    }

    @GetMapping("/warehouses/{id}")
    public R<InventoryWarehouseVO> getWarehouseById(@PathVariable Integer id) {
        return R.success(inventoryService.getWarehouseById(id));
    }

    @PostMapping("/warehouses")
    public R<Integer> createWarehouse(@RequestBody InventoryWarehouseVO vo) {
        return R.success(inventoryService.createWarehouse(vo));
    }

    @PutMapping("/warehouses/{id}")
    public R<Integer> updateWarehouse(@PathVariable Integer id, @RequestBody InventoryWarehouseVO vo) {
        return R.success(inventoryService.updateWarehouse(id, vo));
    }

    @DeleteMapping("/warehouses/{id}")
    public R<Integer> deleteWarehouse(@PathVariable Integer id) {
        return R.success(inventoryService.deleteWarehouse(id));
    }

    @GetMapping("/suppliers")
    public R<List<InventorySupplierVO>> listSuppliers() {
        return R.success(inventoryService.listSuppliers());
    }

    @GetMapping("/suppliers/{id}")
    public R<InventorySupplierVO> getSupplierById(@PathVariable Integer id) {
        return R.success(inventoryService.getSupplierById(id));
    }

    @PostMapping("/suppliers")
    public R<Integer> createSupplier(@RequestBody InventorySupplierVO vo) {
        return R.success(inventoryService.createSupplier(vo));
    }

    @PutMapping("/suppliers/{id}")
    public R<Integer> updateSupplier(@PathVariable Integer id, @RequestBody InventorySupplierVO vo) {
        return R.success(inventoryService.updateSupplier(id, vo));
    }

    @DeleteMapping("/suppliers/{id}")
    public R<Integer> deleteSupplier(@PathVariable Integer id) {
        return R.success(inventoryService.deleteSupplier(id));
    }

    @GetMapping("/inbound-records")
    public R<List<InventoryInboundVO>> listInboundRecords(
            @RequestParam(required = false) String status) {
        return R.success(inventoryService.listInboundRecords(status));
    }

    @GetMapping("/inbound-records/{id}")
    public R<InventoryInboundVO> getInboundRecordById(@PathVariable Integer id) {
        return R.success(inventoryService.getInboundRecordById(id));
    }

    @PostMapping("/inbound-records")
    public R<Integer> createInboundRecord(@RequestBody InventoryInboundCreateRequest request) {
        return R.success(inventoryService.createInboundRecord(request));
    }

    @PutMapping("/inbound-records/{id}/status")
    public R<Integer> updateInboundStatus(@PathVariable Integer id, @RequestParam String status) {
        return R.success(inventoryService.updateInboundStatus(id, status));
    }

    @DeleteMapping("/inbound-records/{id}")
    public R<Integer> deleteInboundRecord(@PathVariable Integer id) {
        return R.success(inventoryService.deleteInboundRecord(id));
    }

    @GetMapping("/outbound-records")
    public R<List<InventoryOutboundVO>> listOutboundRecords(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        return R.success(inventoryService.listOutboundRecords(status, type));
    }

    @GetMapping("/outbound-records/{id}")
    public R<InventoryOutboundVO> getOutboundRecordById(@PathVariable Integer id) {
        return R.success(inventoryService.getOutboundRecordById(id));
    }

    @PostMapping("/outbound-records")
    public R<Integer> createOutboundRecord(@RequestBody InventoryOutboundCreateRequest request) {
        return R.success(inventoryService.createOutboundRecord(request));
    }

    @PutMapping("/outbound-records/{id}/status")
    public R<Integer> updateOutboundStatus(@PathVariable Integer id, @RequestParam String status) {
        return R.success(inventoryService.updateOutboundStatus(id, status));
    }

    @DeleteMapping("/outbound-records/{id}")
    public R<Integer> deleteOutboundRecord(@PathVariable Integer id) {
        return R.success(inventoryService.deleteOutboundRecord(id));
    }

    @GetMapping("/transfer-records")
    public R<List<InventoryTransferVO>> listTransferRecords(
            @RequestParam(required = false) String status) {
        return R.success(inventoryService.listTransferRecords(status));
    }

    @GetMapping("/transfer-records/{id}")
    public R<InventoryTransferVO> getTransferRecordById(@PathVariable Integer id) {
        return R.success(inventoryService.getTransferRecordById(id));
    }

    @PostMapping("/transfer-records")
    public R<Integer> createTransferRecord(@RequestBody InventoryTransferCreateRequest request) {
        return R.success(inventoryService.createTransferRecord(request));
    }

    @PutMapping("/transfer-records/{id}/status")
    public R<Integer> updateTransferStatus(@PathVariable Integer id, @RequestParam String status) {
        return R.success(inventoryService.updateTransferStatus(id, status));
    }

    @DeleteMapping("/transfer-records/{id}")
    public R<Integer> deleteTransferRecord(@PathVariable Integer id) {
        return R.success(inventoryService.deleteTransferRecord(id));
    }
}
