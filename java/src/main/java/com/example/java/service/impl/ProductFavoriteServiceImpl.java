package com.example.java.service.impl;

import com.example.java.exception.BusinessException;
import com.example.java.mapper.ProductFavoriteMapper;
import com.example.java.mapper.ProductMapper;
import com.example.java.service.ProductFavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductFavoriteServiceImpl implements ProductFavoriteService {

    private final ProductFavoriteMapper favoriteMapper;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public void addFavorite(String userId, String productId) {
        if (userId == null || productId == null) {
            throw new BusinessException("参数错误");
        }
        if (productMapper.selectById(productId) == null) {
            throw new BusinessException("产品不存在");
        }
        if (favoriteMapper.exists(userId, productId)) {
            return; // 已收藏则忽略
        }
        favoriteMapper.insert(userId, productId);
    }

    @Override
    @Transactional
    public void removeFavorite(String userId, String productId) {
        if (userId == null || productId == null) return;
        favoriteMapper.delete(userId, productId);
    }

    @Override
    public boolean isFavorite(String userId, String productId) {
        if (userId == null || productId == null) return false;
        return favoriteMapper.exists(userId, productId);
    }

    @Override
    public List<String> listFavorites(String userId) {
        if (userId == null) return List.of();
        return favoriteMapper.selectByUserId(userId);
    }
}
