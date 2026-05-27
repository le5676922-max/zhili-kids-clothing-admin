package com.example.java.service;

import java.util.Map;

public interface DataCenterService {
    Map<String, Object> getIndustryOverview();
    Map<String, Object> getMarketAnalysis();
    Map<String, Object> getSupplyChainData();
    Map<String, Object> getTalentStatistics();
}
