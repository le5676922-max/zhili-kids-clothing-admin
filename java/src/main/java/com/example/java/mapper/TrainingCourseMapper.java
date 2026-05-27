package com.example.java.mapper;

import com.example.java.entity.TrainingCourse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 培训课程 Mapper
 */
@Mapper
public interface TrainingCourseMapper {

    /**
     * 查询所有上架课程
     */
    List<TrainingCourse> findAll();

    /**
     * 按类别、级别、形式筛选课程
     */
    List<TrainingCourse> search(@Param("category") String category,
                                @Param("level") String level,
                                @Param("type") String type);

    /** 管理端：分页查询全部课程（含上架/下架） */
    List<TrainingCourse> findListForAdmin(@Param("offset") int offset, @Param("limit") int limit);
    int countForAdmin();
    TrainingCourse selectById(@Param("id") int id);
    int insert(TrainingCourse course);
    int updateStatus(@Param("id") int id, @Param("status") int status);
    int incrementEnrollCount(@Param("id") int id);
}
