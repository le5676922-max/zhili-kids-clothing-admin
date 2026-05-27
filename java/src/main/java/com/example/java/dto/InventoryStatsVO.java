package com.example.java.dto;

import lombok.Data;

@Data
public class InventoryStatsVO {
    private int totalProducts;
    private int lowStockCount;
    private int totalWarehouses;
    private int totalSuppliers;
    private int pendingInboundCount;
    private int pendingOutboundCount;
    private int todayInboundCount;
    private int todayOutboundCount;
}
