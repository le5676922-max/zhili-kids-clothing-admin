package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.service.DataCenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/data-center")
@RequiredArgsConstructor
public class DataCenterController {

    private final DataCenterService dataCenterService;

    @GetMapping("/industry-overview")
    public R<Map<String, Object>> getIndustryOverview() {
        return R.success(dataCenterService.getIndustryOverview());
    }

    @GetMapping("/market-analysis")
    public R<Map<String, Object>> getMarketAnalysis() {
        return R.success(dataCenterService.getMarketAnalysis());
    }

    @GetMapping("/supply-chain")
    public R<Map<String, Object>> getSupplyChainData() {
        return R.success(dataCenterService.getSupplyChainData());
    }

    @GetMapping("/talent-statistics")
    public R<Map<String, Object>> getTalentStatistics() {
        return R.success(dataCenterService.getTalentStatistics());
    }

    @GetMapping("/all")
    public R<Map<String, Object>> getAllData() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("industryOverview", dataCenterService.getIndustryOverview());
        data.put("marketAnalysis", dataCenterService.getMarketAnalysis());
        data.put("supplyChain", dataCenterService.getSupplyChainData());
        data.put("talentStatistics", dataCenterService.getTalentStatistics());
        return R.success(data);
    }
}
