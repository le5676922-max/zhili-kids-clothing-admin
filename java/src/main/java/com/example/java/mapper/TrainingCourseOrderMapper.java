package com.example.java.mapper;

import com.example.java.dto.admin.AdminCourseOrderRowDTO;
import com.example.java.entity.TrainingCourseOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TrainingCourseOrderMapper {
    int insert(TrainingCourseOrder order);
    List<AdminCourseOrderRowDTO> selectAllForAdmin(@Param("offset") int offset, @Param("limit") int limit);
    int countForAdmin();
    List<TrainingCourseOrder> selectByUserId(@Param("userId") String userId);
    /** 检查用户是否已购买过该课程 */
    TrainingCourseOrder selectByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") Integer courseId);
}
