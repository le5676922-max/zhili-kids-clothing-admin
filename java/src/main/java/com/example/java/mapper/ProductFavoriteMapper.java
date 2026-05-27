package com.example.java.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ProductFavoriteMapper {

    int insert(@Param("userId") String userId, @Param("productId") String productId);

    int delete(@Param("userId") String userId, @Param("productId") String productId);

    boolean exists(@Param("userId") String userId, @Param("productId") String productId);

    List<String> selectByUserId(@Param("userId") String userId);

    int deleteByUserId(@Param("userId") String userId);
}
