package com.example.java;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.java.mapper")
public class ZhiliKidsIndustryApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZhiliKidsIndustryApplication.class, args);
    }

}
