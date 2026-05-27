package com.example.java.service.impl;

import com.example.java.dto.TrainingCourseCreateRequest;
import com.example.java.dto.admin.AdminCoursePageResult;
import com.example.java.entity.TrainingCourse;
import com.example.java.mapper.TrainingCourseMapper;
import com.example.java.service.TrainingCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingCourseServiceImpl implements TrainingCourseService {

    private final TrainingCourseMapper trainingCourseMapper;

    @Override
    public List<TrainingCourse> getAllCourses() {
        return trainingCourseMapper.findAll();
    }

    @Override
    public List<TrainingCourse> searchCourses(String category, String level, String type) {
        return trainingCourseMapper.search(category, level, type);
    }

    @Override
    public AdminCoursePageResult listForAdmin(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = trainingCourseMapper.countForAdmin();
        List<TrainingCourse> list = trainingCourseMapper.findListForAdmin(offset, limit);
        return new AdminCoursePageResult(list, total);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public TrainingCourse addCourse(TrainingCourseCreateRequest request) {
        TrainingCourse c = new TrainingCourse();
        c.setCourseName(request.getCourseName());
        c.setCourseCategory(request.getCourseCategory());
        c.setCourseLevel(request.getCourseLevel());
        c.setCourseType(request.getCourseType());
        c.setStartDate(request.getStartDate());
        c.setDuration(request.getDuration());
        c.setInstructor(request.getInstructor());
        c.setPrice(request.getPrice());
        c.setOriginalPrice(request.getOriginalPrice() != null ? request.getOriginalPrice() : request.getPrice());
        c.setCourseDescription(request.getCourseDescription());
        c.setCourseImage(request.getCourseImage());
        c.setTags(request.getTags());
        c.setEnrollCount(0);
        c.setStatus(1);
        trainingCourseMapper.insert(c);
        return trainingCourseMapper.selectById(c.getId());
    }

    @Override
    public void adminUpdateStatus(int courseId, int status) {
        if (status != 0 && status != 1) {
            throw new com.example.java.exception.BusinessException("状态只能为 0(下架) 或 1(上架)");
        }
        TrainingCourse c = trainingCourseMapper.selectById(courseId);
        if (c == null) {
            throw new com.example.java.exception.BusinessException("课程不存在");
        }
        trainingCourseMapper.updateStatus(courseId, status);
    }
}
