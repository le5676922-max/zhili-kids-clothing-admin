package com.example.java.dto.admin;

import com.example.java.entity.TrainingCourse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCoursePageResult implements Serializable {
    private static final long serialVersionUID = 1L;
    private List<TrainingCourse> list;
    private long total;
}
