package com.example.java.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCourseOrderPageResult implements Serializable {
    private static final long serialVersionUID = 1L;
    private List<AdminCourseOrderRowDTO> list;
    private long total;
}
