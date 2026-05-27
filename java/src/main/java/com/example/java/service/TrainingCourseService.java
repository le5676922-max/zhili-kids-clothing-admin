package com.example.java.service;

import com.example.java.dto.TrainingCourseCreateRequest;
import com.example.java.dto.admin.AdminCoursePageResult;
import com.example.java.entity.TrainingCourse;

import java.util.List;

/**
 * 培训课程服务
 */
public interface TrainingCourseService {

    List<TrainingCourse> getAllCourses();
    List<TrainingCourse> searchCourses(String category, String level, String type);

    /** 管理端：分页列表 */
    AdminCoursePageResult listForAdmin(int page, int pageSize);
    /** 管理端：新增课程 */
    TrainingCourse addCourse(TrainingCourseCreateRequest request);
    /** 管理端：上架/下架 */
    void adminUpdateStatus(int courseId, int status);
}
