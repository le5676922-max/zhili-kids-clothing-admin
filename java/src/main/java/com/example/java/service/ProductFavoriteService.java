package com.example.java.service;

import java.util.List;

public interface ProductFavoriteService {
    void addFavorite(String userId, String productId);
    void removeFavorite(String userId, String productId);
    boolean isFavorite(String userId, String productId);
    List<String> listFavorites(String userId);
}
