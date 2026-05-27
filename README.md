# 织里镇童装产业协同管理平台

基于 Spring Boot 3.2 的童装产业一站式数字化管理平台，涵盖商城交易、供需对接、培训课程、人才招聘、智能客服、进销存管理等核心业务模块。

## 技术栈

| 类别       | 技术                                                         |
| ---------- | ------------------------------------------------------------ |
| 核心框架   | Spring Boot 3.2 + Java 17                                    |
| 安全认证   | Spring Security + JWT（无状态认证，12h 过期）               |
| 数据持久层 | MyBatis 3 + MySQL 8.0                                        |
| 缓存       | Redis                                                         |
| 实时通讯   | WebSocket（Native + STOMP 双模式）                           |
| 文件存储   | 阿里云 OSS                                                   |
| 邮件服务   | QQ 邮箱 SMTP（验证码发送）                                   |
| AI 服务    | DeepSeek V4 Flash（纯文本） + 阿里云 DashScope Qwen VL（视觉识别） |
| 文档解析   | 阿里云文档智能（营业执照 OCR）                               |
| 反向代理   | Nginx 1.26                                                   |

## 功能模块

### 用户中心
- 注册 / 登录 / 密码重置 / 邮箱变更（邮件验证码）
- 个人信息管理、头像上传

### 商城交易
- 商品浏览、搜索、收藏
- 购物车管理
- 订单下单、物流追踪、退款申请

### 供需对接
- 供应信息 / 需求信息发布
- 供需撮合匹配
- 附件上传与管理

### 培训课程
- 课程发布与管理
- 课程下单购买
- 课程评价

### 人才招聘
- 岗位发布与浏览
- 求职申请与跟踪

### 进销存管理
- 多仓库管理、供应商管理
- 商品入库 / 出库 / 调拨
- 库存查询

### 即时通讯
- WebSocket 实时聊天
- 联系人列表、聊天记录
- 临时会话（工单、招聘场景）

### 工单系统
- 工单创建与回复
- WebSocket 实时工单沟通
- 工单状态跟踪

### AI 智能助手
- 双模型架构：DeepSeek（文本对话）+ Qwen VL（图片理解）
- 知识库 RAG 检索增强
- 支持多轮对话与多模态输入

### 管理后台
- 用户管理、商品管理、订单管理
- 供需信息审核
- 数据统计概览

### 其他
- 企业认领与关注
- 营业执照上传与 OCR 识别
- 站内消息通知

## 项目结构

```
├── java/                         # 后端主项目
│   ├── src/main/java/com/example/java/
│   │   ├── common/               # 通用响应类 R
│   │   ├── config/               # 配置（Security、WebSocket、OSS、定时任务）
│   │   ├── controller/           # 控制器（31 个）
│   │   ├── dto/                  # 数据传输对象
│   │   ├── entity/               # 实体类
│   │   ├── exception/            # 全局异常处理
│   │   ├── mapper/               # MyBatis Mapper 接口
│   │   ├── security/             # JWT 工具、认证过滤器
│   │   ├── service/              # 业务服务接口
│   │   │   └── impl/             # 业务服务实现
│   │   └── websocket/            # WebSocket 端点
│   └── src/main/resources/
│       ├── application.yaml      # 主配置文件
│       └── mapper/               # MyBatis XML 映射文件
├── redis/                        # Redis for Windows
└── nginx-1.26.3/                 # Nginx for Windows
```

## 快速开始

### 环境要求

- JDK 17+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.8+

### 1. 创建数据库

```sql
CREATE DATABASE zhili_kids_industry DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'zhili_kids_industry'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zhili_kids_industry.* TO 'zhili_kids_industry'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 修改配置

编辑 `java/src/main/resources/application.yaml`，替换以下配置项：

```yaml
spring:
  datasource:
    password: your_db_password       # 数据库密码

spring.mail:
  password: your_smtp_password       # QQ邮箱SMTP授权码

aliyun.oss:
  access-key-id: your_ak             # 阿里云 AccessKey
  access-key-secret: your_sk         # 阿里云 SecretKey

deepseek:
  api-key: your_deepseek_api_key     # DeepSeek API Key

dashscope:
  api-key: your_dashscope_api_key    # 阿里云 DashScope API Key
```

### 3. 启动 Redis

```bash
redis-server.exe
```

### 4. 启动应用

```bash
cd java
mvnw spring-boot:run
```

应用启动后访问：`http://localhost:8080`

## ⚠️ 安全提醒

`application.yaml` 中包含数据库密码、邮箱授权码、云服务 AK/SK、API Key 等敏感信息。**上传到公开仓库前**请务必：

1. 将 `application.yaml` 中的敏感值替换为占位符（如上所示）
2. 通过环境变量或外部配置文件注入真实值
3. 在 `.gitignore` 中排除敏感配置文件
4. 如果已提交过敏感信息，请轮换所有已泄露的密钥和密码
