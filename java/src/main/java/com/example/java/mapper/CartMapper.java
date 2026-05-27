package com.example.java.mapper;

import com.example.java.dto.CartItemVO;
import com.example.java.entity.Cart;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 购物车 Mapper
 */
@Mapper
public interface CartMapper {

    int insert(Cart cart);

    Cart findByUserAndProductAndSku(@Param("userId") String userId,
                                    @Param("productId") String productId,
                                    @Param("selectedColor") String selectedColor,
                                    @Param("selectedSize") String selectedSize);

    int updateQuantity(@Param("id") Integer id, @Param("quantity") Integer quantity, @Param("userId") String userId);

    int addQuantity(@Param("id") Integer id, @Param("add") int add, @Param("userId") String userId);

    Cart findByIdAndUserId(@Param("id") Integer id, @Param("userId") String userId);

    int deleteById(@Param("id") Integer id, @Param("userId") String userId);

    int deleteByUserId(@Param("userId") String userId);

    List<CartItemVO> findListByUserId(@Param("userId") String userId);

    int countByUserId(@Param("userId") String userId);

    /**
     * 根据用户ID和产品ID查找购物车项ID列表
     */
    List<Integer> findCartIdsByUserIdAndProductId(@Param("userId") String userId, @Param("productId") String productId);
}
