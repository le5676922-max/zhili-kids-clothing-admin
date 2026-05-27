package com.example.java.service.impl;

import com.example.java.dto.CartAddRequest;
import com.example.java.dto.CartItemVO;
import com.example.java.entity.Cart;
import com.example.java.exception.BusinessException;
import com.example.java.mapper.CartMapper;
import com.example.java.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 购物车服务实现
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartMapper cartMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(String userId, CartAddRequest request) {
        String color = request.getSelectedColor() != null ? request.getSelectedColor().trim() : "";
        String size = request.getSelectedSize() != null ? request.getSelectedSize().trim() : "";
        Cart existing = cartMapper.findByUserAndProductAndSku(userId, request.getProductId(), color, size);
        if (existing != null) {
            cartMapper.addQuantity(existing.getId(), request.getQuantity(), userId);
        } else {
            Cart cart = new Cart();
            cart.setUserId(userId);
            cart.setProductId(request.getProductId());
            cart.setSelectedColor(color.isEmpty() ? null : color);
            cart.setSelectedSize(size.isEmpty() ? null : size);
            cart.setQuantity(request.getQuantity());
            cartMapper.insert(cart);
        }
    }

    @Override
    public List<CartItemVO> list(String userId) {
        return cartMapper.findListByUserId(userId);
    }

    @Override
    public int count(String userId) {
        return cartMapper.countByUserId(userId);
    }

    @Override
    public void updateQuantity(String userId, Integer cartId, Integer quantity) {
        if (cartMapper.findByIdAndUserId(cartId, userId) == null) {
            throw new BusinessException("购物车项不存在");
        }
        if (quantity == null || quantity < 1) quantity = 1;
        if (quantity > 99) quantity = 99;
        cartMapper.updateQuantity(cartId, quantity, userId);
    }

    @Override
    public void delete(String userId, Integer cartId) {
        if (cartMapper.findByIdAndUserId(cartId, userId) == null) {
            throw new BusinessException("购物车项不存在");
        }
        cartMapper.deleteById(cartId, userId);
    }

    @Override
    public void clearCart(String userId, List<Integer> cartIds) {
        for (Integer cartId : cartIds) {
            delete(userId, cartId);
        }
    }

    @Override
    public List<Integer> findCartIdsByUserIdAndProductId(String userId, String productId) {
        return cartMapper.findCartIdsByUserIdAndProductId(userId, productId);
    }
}
