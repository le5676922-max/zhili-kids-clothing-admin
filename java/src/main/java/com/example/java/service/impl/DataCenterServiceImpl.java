package com.example.java.service.impl;

import com.example.java.mapper.*;
import com.example.java.service.DataCenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DataCenterServiceImpl implements DataCenterService {

    private final UserMapper userMapper;
    private final ProductMapper productMapper;
    private final OrderMapper orderMapper;
    private final SupplyDemandMapper supplyDemandMapper;
    private final SupplySupplyMapper supplySupplyMapper;
    private final SupplyConnectionMapper supplyConnectionMapper;

    @Override
    public Map<String, Object> getIndustryOverview() {
        Map<String, Object> data = new LinkedHashMap<>();

        long totalEnterprises = userMapper.countForAdmin(null, 2, 1);
        long totalProducts = productMapper.countForAdmin();
        long totalOrders = orderMapper.countForAdmin();

        data.put("registeredCompanies", totalEnterprises);
        data.put("totalProducts", totalProducts);
        data.put("totalOrders", totalOrders);

        return data;
    }

    @Override
    public Map<String, Object> getMarketAnalysis() {
        Map<String, Object> data = new LinkedHashMap<>();

        long totalOrders = orderMapper.countForAdmin();
        long totalProducts = productMapper.countForAdmin();

        data.put("totalOrders", totalOrders);
        data.put("totalProducts", totalProducts);

        return data;
    }

    @Override
    public Map<String, Object> getSupplyChainData() {
        Map<String, Object> data = new LinkedHashMap<>();

        long totalDemands = supplyDemandMapper.countForAdmin();
        long totalSupplies = supplySupplyMapper.countForAdmin();
        long totalConnections = supplyConnectionMapper.countForAdmin();

        data.put("totalDemands", totalDemands);
        data.put("totalSupplies", totalSupplies);
        data.put("totalConnections", totalConnections);
        data.put("matchRate", totalDemands > 0
                ? String.format("%.1f%%", totalConnections * 100.0 / totalDemands)
                : "暂无数据");

        return data;
    }

    @Override
    public Map<String, Object> getTalentStatistics() {
        Map<String, Object> data = new LinkedHashMap<>();

        long totalEnterprises = userMapper.countForAdmin(null, 2, 1);
        long totalPersonalUsers = userMapper.countForAdmin(null, 1, null);

        data.put("enterpriseCount", totalEnterprises);
        data.put("personalUserCount", totalPersonalUsers);

        return data;
    }
}
