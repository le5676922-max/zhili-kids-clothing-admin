package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.entity.TrainingCourse;
import com.example.java.service.TrainingCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 培训课程接口（公开，无需登录）
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TrainingCourseController {

    private final TrainingCourseService trainingCourseService;

    /**
     * 获取所有上架课程列表
     */
    @GetMapping("/courses")
    public R<List<TrainingCourse>> list() {
        List<TrainingCourse> list = trainingCourseService.getAllCourses();
        return R.success(list);
    }

    /**
     * 筛选课程：category, level, type
     */
    @GetMapping("/courses/search")
    public R<List<TrainingCourse>> search(@RequestParam Map<String, String> params) {
        String category = params.get("category");
        String level = params.get("level");
        String type = params.get("type");
        List<TrainingCourse> list = trainingCourseService.searchCourses(category, level, type);
        return R.success(list);
    }
}
