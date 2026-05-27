-- =====================================================
-- 织里镇童装产业系统 - 数据库初始化脚本
-- 数据库: zhili_kids_industry
-- =====================================================

-- 创建数据库
DROP DATABASE IF EXISTS `zhili_kids_industry`;
CREATE DATABASE `zhili_kids_industry` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `zhili_kids_industry`;

-- =====================================================
-- 用户表
-- =====================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
                         `id` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '用户ID',
                         `email` VARCHAR(128) NOT NULL UNIQUE COMMENT '邮箱（登录账号）',
                         `password` VARCHAR(256) NOT NULL COMMENT '密码（BCrypt哈希存储，兼容明文旧数据）',
                         `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
                         `avatar` VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
                         `user_type` INT DEFAULT 1 COMMENT '用户类型: 1=个人 2=企业 3=管理员',
                         `is_admin` TINYINT(1) DEFAULT 0 COMMENT '是否管理员: 0=否 1=是',
                         `enterprise_status` INT DEFAULT NULL COMMENT '企业审核状态: 0=待审核 1=已通过 2=已拒绝',
                         `enterprise_name` VARCHAR(128) DEFAULT NULL COMMENT '企业名称',
                         `enterprise_license` VARCHAR(64) DEFAULT NULL COMMENT '营业执照号码',
                         `license_image_url` VARCHAR(512) DEFAULT NULL COMMENT '营业执照图片URL',
                         `enterprise_address` VARCHAR(256) DEFAULT NULL COMMENT '企业地址（审核通过后必填）',
                         `enterprise_phone` VARCHAR(32) DEFAULT NULL COMMENT '企业电话（必填）',
                         `enterprise_contact_email` VARCHAR(128) DEFAULT NULL COMMENT '企业联系邮箱（必填）',
                         `enterprise_website` VARCHAR(256) DEFAULT NULL COMMENT '企业网站（选填）',
                         `enterprise_introduction` TEXT DEFAULT NULL COMMENT '企业介绍',
                         `enterprise_tags` VARCHAR(512) DEFAULT NULL COMMENT '自定义标签，逗号分隔',
                         `enterprise_certifications` VARCHAR(512) DEFAULT NULL COMMENT '企业认证，逗号分隔',
                         `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                         `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                         INDEX `idx_email` (`email`),
                         INDEX `idx_user_type` (`user_type`),
                         INDEX `idx_enterprise_status` (`enterprise_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 初始数据：后端管理员账号
-- 说明：is_admin = 1 表示管理员账号，登录后自动进入管理后台
-- =====================================================
INSERT INTO `users` (`id`, `email`, `password`, `nickname`, `user_type`, `is_admin`, `enterprise_status`, `enterprise_name`, `enterprise_license`, `license_image_url`, `created_at`, `updated_at`)
VALUES (
           'admin001',
           '3171739575@qq.com',
           '12345678',
           '超级管理员',
           3,
           1,
           NULL,
           NULL,
           NULL,
           NULL,
           NOW(),
           NOW()
       );

-- =====================================================
-- 测试数据：个人用户（user_type = 1，is_admin = 0 表示普通用户）
-- =====================================================
INSERT INTO `users` (`id`, `email`, `password`, `nickname`, `user_type`, `is_admin`, `enterprise_status`, `enterprise_name`, `enterprise_license`, `license_image_url`, `created_at`, `updated_at`) VALUES
                                                                                                                                                                                                        ('user001', 'user1@qq.com', '12345678', '张三', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user002', 'lisi@qq.com', '12345678', '李四', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user003', 'wangwu@126.com', '12345678', '王五', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user004', 'zhaoliu@gmail.com', '12345678', '赵六', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user005', 'sunqi@outlook.com', '12345678', '孙七', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user006', 'zhouba@hotmail.com', '12345678', '周八', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user007', 'wujiu@foxmail.com', '12345678', '吴九', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user008', 'zhengshi@163.com', '12345678', '郑十', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user009', 'chenyi@qq.com', '12345678', '陈一', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW()),
                                                                                                                                                                                                        ('user010', 'huangchu@126.com', '12345678', '黄初', 1, 0, NULL, NULL, NULL, NULL, NOW(), NOW());

-- =====================================================
-- 测试数据：16家企业用户（user_type = 2，enterprise_status = 1 已通过）
-- avatar和license_image_url字段都使用OSS URL
-- =====================================================
INSERT INTO `users` (`id`, `email`, `password`, `nickname`, `avatar`, `user_type`, `is_admin`, `enterprise_status`, `enterprise_name`, `enterprise_license`, `license_image_url`, `enterprise_address`, `enterprise_phone`, `enterprise_contact_email`, `enterprise_website`, `enterprise_introduction`, `enterprise_tags`, `enterprise_certifications`, `created_at`, `updated_at`) VALUES
                                                                                                                                                                                                                                                                                                                                                                                         ('ent001', 'ent1@qq.com', '12345678', '浙江童趣', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo1.jpg', 2, 0, 1, '浙江童趣服饰有限公司', '91330511MA28ABCD01', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo1.jpg', '浙江省湖州市织里镇开发区创业大道88号', '0572-1234567878', 'ent1@qq.com', 'www.tongqu.com', '专注于3-12岁儿童服装的设计和生产，年产能超过200万件，产品远销欧美和东南亚市场。', '童装,设计,生产', 'ISO9001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent002', 'ent2@qq.com', '12345678', '小森林设计', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo2.jpg', 2, 0, 1, '湖州小森林童装设计工作室', '91330511MA28ABCD02', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo2.jpg', '浙江省湖州市织里镇时尚产业园C区12号', '0572-87654321', 'ent2@qq.com', 'www.xiaosenlin.com', '专注于环保、可持续的童装设计，每年推出4个系列，倡导天然环保的穿着理念。', '设计,环保,有机棉', 'GOTS认证', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent003', 'youzhimianliao@supply.com', '12345678', '优质面料', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo3.jpg', 2, 0, 1, '织里优质面料有限公司', '91330511MA28ABCD03', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo3.jpg', '浙江省湖州市织里镇工业园区纺织路56号', '0572-56781234', 'youzhi@supply.com', 'www.youzhi.com', '提供各类高品质童装面料，包括棉、麻、丝、毛等天然材质，以及功能性面料。', '面料,原材料,供应', 'Oeko-Tex', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent004', 'kuailetongnian@factory.com', '12345678', '快乐童年', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo4.jpg', 2, 0, 1, '快乐童年服饰有限公司', '91330511MA28ABCD04', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo4.jpg', '浙江省湖州市织里镇产业园A区23号', '0572-98765432', 'kuailetn@factory.com', 'www.kuailetn.com', '专注于婴幼儿服装的研发与生产，采用天然有机面料，关注婴幼儿肌肤健康。', '婴幼儿,有机,安全', 'ISO9001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent005', 'caihongdesign@studio.com', '12345678', '彩虹设计', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo5.jpg', 2, 0, 1, '彩虹童装设计有限公司', '91330511MA28ABCD05', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo5.jpg', '浙江省湖州市织里镇创意园B栋301室', '0572-65432198', 'caihong@studio.com', 'www.caihong.com', '致力于创新、时尚的童装设计，专注于2-10岁儿童服装，设计风格活泼多彩。', '设计,时尚,创新', 'GOTS认证', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent006', 'xingguongtrade@trade.com', '12345678', '星光贸易', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo6.jpg', 2, 0, 1, '湖州星光童装贸易有限公司', '91330511MA28ABCD06', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo6.jpg', '浙江省湖州市织里镇商贸城A区108号', '0572-87654321', 'xingguang@trade.com', 'www.xingguang.com', '专业童装批发销售渠道，拥有线上线下多个销售平台，年销售额超过5亿元。', '批发,销售,电商', 'ISO9001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent007', 'huanbaofangzhi@eco.com', '12345678', '环保纺织', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo7.jpg', 2, 0, 1, '织里环保纺织品有限公司', '91330511MA28ABCD07', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo7.jpg', '浙江省湖州市织里镇生态产业园C区15号', '0572-76543210', 'huanbao@eco.com', 'www.huanbao.com', '专注于环保童装面料的研发与生产，使用有机棉及可降解材料，符合国际环保标准。', '环保,有机,可降解', 'Oeko-Tex', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent008', 'tongmeng@factory.com', '12345678', '童梦服饰', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo8.jpg', 2, 0, 1, '童梦服饰有限公司', '91330511MA28ABCD08', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo8.jpg', '浙江省湖州市织里镇纺织工业园D区45号', '0572-23456789', 'tongmeng@factory.com', 'www.tongmeng.com', '专注于童装定制服务，提供幼儿园、学校校服及特殊场合儿童服装的设计与生产。', '定制,校服,特殊服装', 'ISO14001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent009', 'yinhua@print.com', '12345678', '星光印花', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo9.jpg', 2, 0, 1, '浙江童装印花有限公司', '91330511MA28ABCD09', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo9.jpg', '浙江省湖州市织里镇科技园B区67号', '0572-34567890', 'yinhua@print.com', 'www.yinhua.com', '专业提供童装印花、刺绣、烫画等工艺服务，拥有先进的数码印花设备和工艺技术。', '印花,刺绣,工艺', 'ISO9001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent010', 'chuangyistudio@studio.com', '12345678', '创意设计', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo10.jpg', 2, 0, 1, '织里创意童装设计工作室', '91330511MA28ABCD10', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo10.jpg', '浙江省湖州市织里镇创业园A栋505室', '0572-45678901', 'chuangyi@studio.com', 'www.chuangyi.com', '由年轻设计师组成的创意团队，专注于创新童装设计，提供设计咨询和样衣开发服务。', '设计,创新,样衣', '无认证', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent011', 'xiaotaoqi@factory.com', '12345678', '小淘气', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo11.jpg', 2, 0, 1, '湖州小淘气童装有限公司', '91330511MA28ABCD11', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo11.jpg', '浙江省湖州市织里镇工业园区童装大道18号', '0572-56789012', 'xiaotaoqi@factory.com', 'www.xiaotaoqi.com', '专注于婴幼儿和学龄前儿童服装的研发与生产，产品以舒适、安全、活泼为设计理念。', '婴幼儿,学前,舒适', 'Oeko-Tex', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent012', 'jinggong@material.com', '12345678', '精工辅料', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo12.jpg', 2, 0, 1, '织里精工童装辅料有限公司', '91330511MA28ABCD12', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo12.jpg', '浙江省湖州市织里镇辅料产业园A区28号', '0572-67890123', 'jinggong@material.com', 'www.jinggong.com', '专业生产童装纽扣、拉链、标牌等辅料，产品种类丰富，质量可靠，价格合理。', '辅料,纽扣,拉链', 'ISO9001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent013', 'tongai@ecom.com', '12345678', '童爱电商', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo13.jpg', 2, 0, 1, '童爱电商平台有限公司', '91330511MA28ABCD13', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo13.jpg', '浙江省湖州市织里镇电子商务产业园1号楼', '0572-78901234', 'tongai@ecom.com', 'www.tongai.com', '专注于童装电子商务平台的运营，为织里童装企业提供线上销售渠道和数字化营销服务。', '电商,平台,营销', '无认证', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent014', 'baozhuang@print.com', '12345678', '包装印刷', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 2, 0, 1, '湖州童装包装印刷有限公司', '91330511MA28ABCD14', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', '浙江省湖州市织里镇包装工业园C区16号', '0572-89012345', 'baozhuang@print.com', 'www.baozhuang.com', '提供童装包装设计与生产，使用环保材料，提供吊牌、包装盒、手提袋等一站式服务。', '包装,吊牌,印刷', 'ISO14001', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent015', 'yanfa@center.com', '12345678', '童装研发', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo15.jpg', 2, 0, 1, '浙江童装研发中心', '91330511MA28ABCD15', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo15.jpg', '浙江省湖州市织里镇科技园A区1号楼', '0572-9012345678', 'yanfa@center.com', 'www.yanfa.com', '童装研发与设计服务机构，提供流行趋势分析、设计开发、技术咨询等专业服务。', '研发,趋势,咨询', 'GOTS认证', NOW(), NOW()),
                                                                                                                                                                                                                                                                                                                                                                                         ('ent016', 'wuliu@logistics.com', '12345678', '物流配送', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo16.jpg', 2, 0, 1, '织里童装物流配送有限公司', '91330511MA28ABCD16', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo16.jpg', '浙江省湖州市织里镇物流园区B区8号', '0572-0123456787', 'wuliu@logistics.com', 'www.wuliu.com', '为织里童装产业提供专业的物流配送服务，覆盖全国各地，提供仓储、配送一体化解决方案。', '物流,仓储,配送', 'ISO9001', NOW(), NOW());

-- =====================================================
-- 工单表
-- =====================================================
DROP TABLE IF EXISTS `work_order_messages`;
DROP TABLE IF EXISTS `work_orders`;

CREATE TABLE `work_orders` (
                               `id` VARCHAR(20) NOT NULL PRIMARY KEY COMMENT '工单ID',
                               `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                               `subject` VARCHAR(200) NOT NULL COMMENT '主题',
                               `content` TEXT COMMENT '内容',
                               `level` VARCHAR(10) DEFAULT '低' COMMENT '级别: 低/中/高',
                               `status` VARCHAR(20) DEFAULT '待处理' COMMENT '状态: 待处理/处理中/已关闭',
                               `create_time` DATETIME NOT NULL COMMENT '创建时间',
                               `last_reply` DATETIME COMMENT '最后回复时间',
                               INDEX `idx_user_id` (`user_id`),
                               INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单表';

CREATE TABLE `work_order_messages` (
                                       `id` INT AUTO_INCREMENT PRIMARY KEY,
                                       `order_id` VARCHAR(20) NOT NULL COMMENT '工单ID',
                                       `role` VARCHAR(20) NOT NULL COMMENT '角色: user/admin',
                                       `content` TEXT NOT NULL COMMENT '内容',
                                       `time` DATETIME NOT NULL COMMENT '时间',
                                       INDEX `idx_order_id` (`order_id`),
                                       FOREIGN KEY (`order_id`) REFERENCES `work_orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单消息表';

-- =====================================================
-- 测试数据：工单（仅示例）
-- =====================================================
INSERT INTO `work_orders` (`id`, `user_id`, `subject`, `content`, `level`, `status`, `create_time`, `last_reply`) VALUES
                                                                                                                   ('WO001', 'user001', '产品上架问题', '请问如何上传新产品图片？', '中', '处理中', '2024-01-15 10:30:00', '2024-01-15 14:20:00'),
                                                                                                                   ('WO002', 'user002', '账户权限咨询', '企业账号有哪些权限？', '低', '待处理', '2024-01-16 09:00:00', '2024-01-16 09:00:00'),
                                                                                                                   ('WO003', 'ent001', '供应链协同需求', '希望加入供应链协同功能', '高', '待处理', '2024-01-17 15:00:00', '2024-01-17 15:00:00');

-- 注意：工单首条内容只存储在 work_orders.content，messages 表不预插首条用户消息
-- getDetail 时会由后端自动将 work_orders.content 补为虚拟首条消息
INSERT INTO `work_order_messages` (`order_id`, `role`, `content`, `time`) VALUES
    ('WO001', 'admin', '您好，请在企业信息页面点击"添加产品"按钮，按照提示上传图片即可。', '2024-01-15 14:20:00');

-- =====================================================
-- 产品表
-- =====================================================
DROP TABLE IF EXISTS `products`;

CREATE TABLE `products` (
                            `id` VARCHAR(20) NOT NULL PRIMARY KEY COMMENT '产品ID',
                            `user_id` VARCHAR(64) NOT NULL COMMENT '所属企业用户ID',
                            `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
                            `description` TEXT DEFAULT NULL COMMENT '产品描述',
                            `category` VARCHAR(100) DEFAULT NULL COMMENT '产品分类：男童服装、女童服装、婴幼儿服装、季节性服装、校园制服、特色产品',
                            `age_range` VARCHAR(50) DEFAULT NULL COMMENT '适用年龄段：0-1岁、1-3岁、3-6岁、6-9岁、9-12岁、12-16岁',
                            `season` VARCHAR(50) DEFAULT NULL COMMENT '适用季节：春季、夏季、秋季、冬季',
                            `material` VARCHAR(50) DEFAULT NULL COMMENT '材质：棉质、棉麻、针织、牛仔、羊毛、涤纶、混纺',
                            `certification` VARCHAR(100) DEFAULT NULL COMMENT '认证：Oeko-Tex、GOTS有机、ISO9001等',
                            `price` DECIMAL(10,2) NOT NULL COMMENT '现价',
                            `original_price` DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
                            `sales` INT DEFAULT 0 COMMENT '累计销量',
                            `stock` INT DEFAULT 0 COMMENT '库存数量',
                            `badge` VARCHAR(20) DEFAULT NULL COMMENT '标签：new(新品)、hot(热销)、organic(有机)、discount(特惠)',
                            `image_url` VARCHAR(512) DEFAULT NULL COMMENT '产品图片URL',
                            `status` INT DEFAULT 1 COMMENT '状态: 0=下架 1=上架',
                            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                            INDEX `idx_user_id` (`user_id`),
                            INDEX `idx_category` (`category`),
                            INDEX `idx_age_range` (`age_range`),
                            INDEX `idx_season` (`season`),
                            INDEX `idx_material` (`material`),
                            INDEX `idx_status` (`status`),
                            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品表';

-- =====================================================
-- 测试数据：产品（来自前端产品展示页）
-- 对应企业用户：
--   ent001: 浙江童趣服饰有限公司
--   ent002: 湖州小森林童装设计工作室
--   ent003: 织里优质童装有限公司（用ent003的企业名）
--   ent004: 快乐童年服饰有限公司
--   ent005: 彩虹童装设计有限公司（用ent006的动感童年运动服饰有限公司）
--   ent008: 童梦服饰有限公司（织里校服定制中心）
--   ent010: 织里创意童装设计工作室
-- =====================================================
INSERT INTO `products` (`id`, `user_id`, `name`, `description`, `category`, `age_range`, `season`, `material`, `certification`, `price`, `original_price`, `sales`, `stock`, `badge`, `image_url`, `status`, `created_at`, `updated_at`) VALUES
-- 1. 2023夏季男童短袖T恤 - 浙江童趣服饰有限公司 (ent001)
('P001', 'ent001', '2023夏季男童短袖T恤', '纯棉材质，透气舒适，适合3-6岁儿童', '男童服装', '3-6岁', '夏季', '棉质', NULL, 99.00, 129.00, 352, 100, 'new', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/boys-tshirt-01.jpg', 1, NOW(), NOW()),

-- 2. 男童弹力牛仔裤 - 织里优质童装有限公司 (ent003)
('P002', 'ent003', '男童弹力牛仔裤', '优质牛仔面料，柔软舒适，弹力设计，活动自如', '男童服装', '6-9岁', '春季,秋季', '牛仔', NULL, 78.00, 98.00, 475, 100, 'hot', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/boys-pants-01.jpg', 1, NOW(), NOW()),

-- 3. 婴幼儿有机棉连体衣 - 快乐童年服饰有限公司 (ent004)
('P003', 'ent004', '婴幼儿有机棉连体衣', 'GOTS认证有机棉，无荧光剂，安全健康，适合0-1岁宝宝', '婴幼儿服装', '0-1岁', '全部', '棉质', 'GOTS有机', 135.00, 168.00, 286, 100, 'organic', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/babies-romper-01.jpg', 1, NOW(), NOW()),

-- 4. 女童公主连衣裙 - 湖州小森林童装设计工作室 (ent002)
('P004', 'ent002', '女童公主连衣裙', '精致蕾丝花边，甜美可爱，适合3-8岁女童，多色可选', '女童服装', '3-6岁', '春季,夏季', '混纺', NULL, 128.00, 158.00, 312, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/girls-dress-01.jpg', 1, NOW(), NOW()),

-- 5. 冬季儿童羽绒服 - 浙江童趣服饰有限公司 (ent001)
('P005', 'ent001', '冬季儿童羽绒服', '90%白鸭绒填充，保暖舒适，防风防水，适合3-10岁儿童', '季节性服装', '3-6岁,6-9岁', '冬季', '羊毛', NULL, 289.00, 389.00, 265, 100, 'discount', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/seasonal-down-01.jpg', 1, NOW(), NOW()),

-- 6. 男童休闲衬衫 - 织里优质童装有限公司 (ent003)
('P006', 'ent003', '男童休闲衬衫', '100%纯棉面料，休闲百搭，适合4-10岁男童', '男童服装', '3-6岁,6-9岁', '春季,秋季', '棉质', NULL, 69.00, 89.00, 198, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/boys-shirt-01.jpg', 1, NOW(), NOW()),

-- 7. 小学生校服 - 童梦服饰有限公司 (ent008)
('P007', 'ent008', '小学生校服', '耐磨面料，舒适透气，符合学校规范要求，多尺码可选', '校园制服', '6-9岁,9-12岁', '春季,秋季', '混纺', NULL, 169.00, 199.00, 203, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/uniforms-primary-01.jpg', 1, NOW(), NOW()),

-- 8. 儿童汉服套装 - 织里创意童装设计工作室 (ent010)
('P008', 'ent010', '儿童汉服套装', '传统文化设计，精致绣花，适合节日及表演活动，多种款式', '特色产品', '3-6岁,6-9岁,9-12岁', '全部', '棉麻', NULL, 189.00, 238.00, 178, 100, 'new', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/special-hanfu-01.jpg', 1, NOW(), NOW()),

-- 9. 幼儿园校服 - 童梦服饰有限公司 (ent008)
('P009', 'ent008', '幼儿园校服', '柔软舒适，活泼可爱，易于穿脱，适合2-6岁儿童', '校园制服', '1-3岁,3-6岁', '春季,秋季', '棉质', NULL, 158.00, 188.00, 203, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/uniforms-kindergarten-01.jpg', 1, NOW(), NOW()),

-- 10. 婴儿连体爬服 - 快乐童年服饰有限公司 (ent004)
('P010', 'ent004', '婴儿连体爬服', '柔软针织面料，宽松设计，不勒不紧，适合0-2岁宝宝', '婴幼儿服装', '0-1岁,1-3岁', '春季,秋季', '针织', 'Oeko-Tex', 89.00, 109.00, 325, 100, 'hot', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/babies-romper-02.jpg', 1, NOW(), NOW()),

-- 11. 女童蓬蓬裙 - 湖州小森林童装设计工作室 (ent002)
('P011', 'ent002', '女童蓬蓬裙', '立体设计，轻盈飘逸，适合3-8岁小女孩参加派对活动', '女童服装', '3-6岁,6-9岁', '春季,夏季', '混纺', NULL, 128.00, 168.00, 156, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/girls-skirt-01.jpg', 1, NOW(), NOW()),

-- 12. 儿童防晒衣 - 湖州星光童装贸易有限公司 (ent006)
('P012', 'ent006', '儿童防晒衣', 'UPF50+防晒面料，轻薄透气，适合夏季户外活动', '季节性服装', '3-6岁,6-9岁,9-12岁', '夏季', '涤纶', NULL, 79.00, 99.00, 289, 100, 'discount', 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/seasonal-sun-01.jpg', 1, NOW(), NOW()),

-- 13. 儿童毛衣 - 织里优质童装有限公司 (ent003)
('P013', 'ent003', '儿童毛衣', '柔软亲肤羊毛混纺，保暖不扎身，适合3-10岁儿童', '季节性服装', '3-6岁,6-9岁', '秋季,冬季', '羊毛', NULL, 119.00, 149.00, 178, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/seasonal-sweater-01.jpg', 1, NOW(), NOW()),

-- 14. 儿童睡衣套装 - 浙江童趣服饰有限公司 (ent001)
('P014', 'ent001', '儿童睡衣套装', '纯棉面料，柔软舒适，可爱卡通图案，适合2-12岁儿童', '特色产品', '1-3岁,3-6岁,6-9岁,9-12岁', '全部', '棉质', NULL, 89.00, 119.00, 253, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/special-pajamas-01.jpg', 1, NOW(), NOW()),

-- 15. 女童牛仔背带裙 - 织里优质童装有限公司 (ent003)
('P015', 'ent003', '女童牛仔背带裙', '优质牛仔面料，经典设计，百搭易搭配，适合3-10岁女童', '女童服装', '3-6岁,6-9岁', '春季,秋季', '牛仔', NULL, 108.00, 138.00, 178, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/girls-pants-01.jpg', 1, NOW(), NOW()),

-- 16. 婴儿保暖背心 - 快乐童年服饰有限公司 (ent004)
('P016', 'ent004', '婴儿保暖背心', '天然彩棉填充，轻薄保暖，适合0-3岁宝宝四季穿着', '婴幼儿服装', '0-1岁,1-3岁', '秋季,冬季', '棉质', 'Oeko-Tex', 69.00, 89.00, 213, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/babies-vest-01.jpg', 1, NOW(), NOW()),

-- 17. 男童马甲背心 - 浙江童趣服饰有限公司 (ent001)
('P017', 'ent001', '男童马甲背心', '轻便保暖，内外可穿，多色可选，适合3-12岁儿童', '季节性服装', '3-6岁,6-9岁,9-12岁', '春季,秋季', '混纺', NULL, 79.00, 99.00, 167, 100, NULL, 'https://zhili-kids-industry-system-products.oss-cn-hangzhou.aliyuncs.com/prodects/boys-vest-01.jpg', 1, NOW(), NOW());

-- =====================================================
-- 购物车表
-- =====================================================
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
                        `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '购物车项ID',
                        `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                        `product_id` VARCHAR(20) NOT NULL COMMENT '产品ID',
                        `selected_color` VARCHAR(32) DEFAULT NULL COMMENT '所选颜色',
                        `selected_size` VARCHAR(32) DEFAULT NULL COMMENT '所选尺码',
                        `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
                        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                        UNIQUE KEY `uk_user_product_sku` (`user_id`, `product_id`, `selected_color`, `selected_size`),
                        INDEX `idx_user_id` (`user_id`),
                        INDEX `idx_product_id` (`product_id`),
                        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                        FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车';

-- =====================================================
-- 查看数据统计（须在 products 表创建并插入之后执行）
-- =====================================================
SELECT '总用户数' AS type, COUNT(*) AS count FROM users
UNION ALL
SELECT '个人用户', COUNT(*) FROM users WHERE user_type = 1
UNION ALL
SELECT '企业用户', COUNT(*) FROM users WHERE user_type = 2
UNION ALL
SELECT '管理员', COUNT(*) FROM users WHERE user_type = 3
UNION ALL
SELECT '待审核企业', COUNT(*) FROM users WHERE user_type = 2 AND enterprise_status = 0
UNION ALL
SELECT '已通过企业', COUNT(*) FROM users WHERE user_type = 2 AND enterprise_status = 1
UNION ALL
SELECT '已拒绝企业', COUNT(*) FROM users WHERE user_type = 2 AND enterprise_status = 2
UNION ALL
SELECT '工单总数', COUNT(*) FROM work_orders
UNION ALL
SELECT '产品总数', COUNT(*) FROM products;

-- =====================================================
-- 订单主表
-- =====================================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
                          `id` VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '订单ID',
                          `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                          `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
                          `status` VARCHAR(20) DEFAULT 'pending' COMMENT '订单状态: pending=待支付, paid=待发货, shipped=已发货, completed=已完成, cancelled=已取消',
                          `receiver_name` VARCHAR(64) NOT NULL COMMENT '收货人姓名',
                          `receiver_phone` VARCHAR(32) NOT NULL COMMENT '收货人电话',
                          `receiver_address` VARCHAR(256) NOT NULL COMMENT '收货地址',
                          `remark` VARCHAR(512) DEFAULT NULL COMMENT '订单备注',
                          `tracking_no` VARCHAR(64) DEFAULT NULL COMMENT '快递单号（商家发货时填写）',
                          `paid_time` DATETIME DEFAULT NULL COMMENT '支付时间',
                          `shipped_time` DATETIME DEFAULT NULL COMMENT '发货时间',
                          `completed_time` DATETIME DEFAULT NULL COMMENT '完成时间',
                          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                          `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                          INDEX `idx_user_id` (`user_id`),
                          INDEX `idx_status` (`status`),
                          INDEX `idx_created_at` (`created_at`),
                          FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- =====================================================
-- 订单明细表
-- =====================================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
                               `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '订单项ID',
                               `order_id` VARCHAR(32) NOT NULL COMMENT '订单ID',
                               `product_id` VARCHAR(20) DEFAULT NULL COMMENT '产品ID',
                               `product_name` VARCHAR(200) NOT NULL COMMENT '产品名称',
                               `product_image` VARCHAR(512) DEFAULT NULL COMMENT '产品图片',
                               `price` DECIMAL(10,2) NOT NULL COMMENT '购买单价',
                               `quantity` INT NOT NULL DEFAULT 1 COMMENT '购买数量',
                               `subtotal` DECIMAL(10,2) NOT NULL COMMENT '小计',
                               `selected_color` VARCHAR(32) DEFAULT NULL COMMENT '所选颜色',
                               `selected_size` VARCHAR(32) DEFAULT NULL COMMENT '所选尺码',
                               `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                               INDEX `idx_order_id` (`order_id`),
                               INDEX `idx_product_id` (`product_id`),
                               FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- =====================================================
-- 退款申请表
-- =====================================================
DROP TABLE IF EXISTS `refunds`;
CREATE TABLE `refunds` (
                           `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '退款ID',
                           `refund_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '退款单号',
                           `order_id` VARCHAR(32) NOT NULL COMMENT '关联订单ID',
                           `user_id` VARCHAR(64) NOT NULL COMMENT '申请人用户ID（买家）',
                           `seller_id` VARCHAR(64) NOT NULL COMMENT '卖家用户ID',
                           `refund_amount` DECIMAL(10,2) NOT NULL COMMENT '退款金额',
                           `refund_type` VARCHAR(20) NOT NULL COMMENT '退款类型：refund=仅退款, return=退货退款',
                           `reason` VARCHAR(100) NOT NULL COMMENT '退款原因',
                           `description` TEXT DEFAULT NULL COMMENT '退款说明',
                           `status` VARCHAR(20) DEFAULT 'pending' COMMENT '退款状态：pending=待审核, approved=审核通过, rejected=审核拒绝, completed=已完成, cancelled=已取消',
                           `original_order_status` VARCHAR(20) DEFAULT NULL COMMENT '申请退款时订单的原始状态（用于拒绝/取消时恢复）',
                           `seller_note` VARCHAR(500) DEFAULT NULL COMMENT '商家处理备注',
                           `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
                           `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                           INDEX `idx_order_id` (`order_id`),
                           INDEX `idx_user_id` (`user_id`),
                           INDEX `idx_seller_id` (`seller_id`),
                           INDEX `idx_status` (`status`),
                           FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
                           FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款申请表';

-- =====================================================
-- 招聘职位表
-- =====================================================
DROP TABLE IF EXISTS `job_positions`;
CREATE TABLE `job_positions` (
                                 `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '职位ID',
                                 `user_id` VARCHAR(64) NOT NULL COMMENT '发布企业(用户ID)',
                                 `job_name` VARCHAR(100) NOT NULL COMMENT '职位名称',
                                 `salary_min` INT NOT NULL COMMENT '最低薪资(千元)',
                                 `salary_max` INT NOT NULL COMMENT '最高薪资(千元)',
                                 `work_location` VARCHAR(100) DEFAULT '湖州市织里镇' COMMENT '工作地点',
                                 `experience` VARCHAR(50) DEFAULT NULL COMMENT '工作经验要求',
                                 `education` VARCHAR(50) DEFAULT NULL COMMENT '学历要求',
                                 `recruit_count` INT DEFAULT 1 COMMENT '招聘人数',
                                 `job_description` TEXT COMMENT '职位描述',
                                 `skills` VARCHAR(500) DEFAULT NULL COMMENT '技能要求(逗号分隔)',
                                 `job_category` VARCHAR(50) DEFAULT NULL COMMENT '职位类别',
                                 `status` TINYINT DEFAULT 1 COMMENT '状态: 1-招聘中, 0-已结束',
                                 `view_count` INT DEFAULT 0 COMMENT '浏览次数',
                                 `published_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
                                 `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                 INDEX `idx_user_id` (`user_id`),
                                 INDEX `idx_job_name` (`job_name`),
                                 INDEX `idx_job_category` (`job_category`),
                                 INDEX `idx_status` (`status`),
                                 FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招聘职位表';

-- =====================================================
-- 职位申请表（个人用户投递简历）
-- =====================================================
DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE `job_applications` (
                                    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '申请ID',
                                    `user_id` VARCHAR(64) NOT NULL COMMENT '申请人(用户ID)',
                                    `job_id` INT NOT NULL COMMENT '职位ID',
                                    `resume_url` VARCHAR(512) NOT NULL COMMENT '简历图片OSS地址',
                                    `status` TINYINT DEFAULT 0 COMMENT '状态: 0-待查看, 1-已查看, 2-已通过, 3-已拒绝',
                                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '投递时间',
                                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                    UNIQUE KEY `uk_user_job` (`user_id`, `job_id`),
                                    INDEX `idx_job_id` (`job_id`),
                                    INDEX `idx_user_id` (`user_id`),
                                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                                    FOREIGN KEY (`job_id`) REFERENCES `job_positions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='职位申请表';

-- =====================================================
-- 招聘沟通聊天记录表（个人与企业实时沟通）
-- =====================================================
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
                                 `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
                                 `sender_id` VARCHAR(64) DEFAULT NULL COMMENT '发送者用户ID',
                                 `receiver_id` VARCHAR(64) DEFAULT NULL COMMENT '接收者用户ID',
                                 `job_id` INT DEFAULT NULL COMMENT '关联职位ID（招聘沟通时使用）',
                                 `connection_id` INT DEFAULT NULL COMMENT '关联供需对接ID（企业间对接沟通时使用）',
                                 `content` TEXT NOT NULL COMMENT '消息内容',
                                 `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
                                 `read_at` DATETIME DEFAULT NULL COMMENT '接收方阅读时间，NULL 表示未读',
                                 INDEX `idx_sender` (`sender_id`),
                                 INDEX `idx_receiver` (`receiver_id`),
                                 INDEX `idx_job` (`job_id`),
                                 INDEX `idx_connection` (`connection_id`),
                                 INDEX `idx_created` (`created_at`),
                                 INDEX `idx_read_at` (`read_at`),
                                 FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
                                 FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
                                 FOREIGN KEY (`job_id`) REFERENCES `job_positions`(`id`) ON DELETE SET NULL
    -- connection_id 外键见下方：在 supply_connections 表创建后再 ALTER 添加，避免 1824「无法打开被引用表」
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招聘沟通聊天记录';

-- 插入职位数据
INSERT INTO `job_positions` (`user_id`, `job_name`, `salary_min`, `salary_max`, `work_location`, `experience`, `education`, `recruit_count`, `job_description`, `skills`, `job_category`, `status`) VALUES
                                                                                                                                                                                                        ('ent001', '童装设计师', 10, 15, '湖州市织里镇', '3-5年', '本科', 5, '负责童装产品的设计与开发，包括款式设计、面料选择、工艺指导等，具有良好的色彩感觉和创新能力，熟悉童装市场趋势。', 'Adobe Illustrator,服装设计,面料开发,趋势分析', 'design', 1),
                                                                                                                                                                                                        ('ent002', '童装生产主管', 15, 20, '湖州市织里镇', '5-10年', '大专', 2, '负责童装生产车间管理，协调生产进度，确保产品质量，优化生产流程，具有丰富的服装生产管理经验，熟悉各类服装工艺。', '生产管理,质量控制,团队管理,工艺优化', 'production', 1),
                                                                                                                                                                                                        ('ent003', '童装电商运营专员', 8, 12, '湖州市织里镇', '1-3年', '本科', 3, '负责公司童装产品的电商平台运营，包括店铺管理、产品上架、活动策划、客户服务等，具有电商运营经验，熟悉主流电商平台。', '电商运营,内容营销,数据分析,客户服务', 'marketing', 1),
                                                                                                                                                                                                        ('ent005', '童装打版师', 7, 10, '湖州市织里镇', '3-5年', '大专', 2, '负责童装样衣打版，精通纸样制作，能独立完成工艺单。', '打版,纸样,工艺单,团队协作', 'technical', 1),
                                                                                                                                                                                                        ('ent007', '童装面料采购专员', 6, 9, '湖州市织里镇', '1-3年', '本科', 1, '负责童装面料采购，供应商开发与管理，成本控制。', '采购,供应链,成本控制,谈判', 'technical', 1),
                                                                                                                                                                                                        ('ent004', '童装质检员', 5, 8, '湖州市织里镇', '1-3年', '高中及以下', 3, '负责童装成品的质量检验，确保产品符合标准。', '质检,细心,标准化,责任心', 'production', 1);

-- =====================================================
-- 招聘沟通示例数据
-- 说明：
--   1. 联系人列表（/auth/chat/contacts）从 chat_messages 按用户聚合，
--      仅当两人之间有往来消息记录时才会出现在列表。
--   2. 若 chat_messages 为空，则联系人列表为空 —— 这是正常现象，发消息后会自动出现。
--   3. 用户在招聘页点击「沟通」后，即使没有历史也会在左侧临时显示该企业。
-- user001=张三（个人）、ent001=浙江童趣（企业）就职位 id=1「童装设计师」的对话
-- =====================================================
INSERT INTO `chat_messages` (`sender_id`, `receiver_id`, `job_id`, `content`, `created_at`, `read_at`) VALUES
                                                                                                           ('user001', 'ent001', 1, '您好，我对贵公司童装设计师岗位很感兴趣，请问还在招聘吗？', '2024-01-15 10:30:00', '2024-01-15 14:20:00'),
                                                                                                           ('ent001', 'user001', 1, '您好，岗位仍在招聘中，欢迎投递简历。请问您有相关工作经验吗？', '2024-01-15 14:20:00', '2024-01-15 15:00:00'),
                                                                                                           ('user001', 'ent001', 1, '有 3 年服装设计经验，熟悉 3-12 岁儿童服装设计。', '2024-01-15 15:00:00', '2024-01-16 09:30:00');

-- ent002=小森林设计（企业）与 user002=李四（个人）就职位 id=2「童装生产主管」的对话
INSERT INTO `chat_messages` (`sender_id`, `receiver_id`, `job_id`, `content`, `created_at`, `read_at`) VALUES
                                                                                                           ('user002', 'ent002', 2, '您好，看到贵公司在招聘生产主管，请问薪资范围是多少？', '2024-01-16 09:00:00', '2024-01-16 10:00:00'),
                                                                                                           ('ent002', 'user002', 2, '您好，基本薪资 15-20K/月，另外有绩效奖金，具体面议。', '2024-01-16 10:00:00', NULL);

-- user003=王五（个人）与 ent001=浙江童趣 就职位 id=1 的另一段对话
INSERT INTO `chat_messages` (`sender_id`, `receiver_id`, `job_id`, `content`, `created_at`, `read_at`) VALUES
    ('user003', 'ent001', 1, '请问贵公司有带薪年假吗？', '2024-01-17 11:00:00', '2024-01-17 11:30:00');

-- =====================================================
-- 培训课程表
-- =====================================================
DROP TABLE IF EXISTS `training_courses`;
CREATE TABLE `training_courses` (
                                    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '课程ID',
                                    `course_name` VARCHAR(100) NOT NULL COMMENT '课程名称',
                                    `course_category` VARCHAR(50) NOT NULL COMMENT '课程类别：设计类、技术类、管理类、营销类',
                                    `course_level` VARCHAR(50) NOT NULL COMMENT '难度级别：入门级、进阶级、中级、高级、专家级',
                                    `course_type` VARCHAR(50) NOT NULL COMMENT '课程形式：线上课程、线下课程、混合式',
                                    `start_date` DATE NOT NULL COMMENT '开课时间',
                                    `duration` INT NOT NULL COMMENT '课程时长（课时）',
                                    `instructor` VARCHAR(50) NOT NULL COMMENT '讲师',
                                    `price` DECIMAL(10,2) NOT NULL COMMENT '现价',
                                    `original_price` DECIMAL(10,2) NOT NULL COMMENT '原价',
                                    `course_description` TEXT NOT NULL COMMENT '课程描述',
                                    `course_image` VARCHAR(255) DEFAULT NULL COMMENT '课程图片',
                                    `tags` VARCHAR(100) DEFAULT NULL COMMENT '标签：热门、新课、推荐',
                                    `enroll_count` INT DEFAULT 0 COMMENT '报名人数',
                                    `status` TINYINT DEFAULT 1 COMMENT '状态：1-上架中，0-已下架',
                                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                    INDEX `idx_category` (`course_category`),
                                    INDEX `idx_level` (`course_level`),
                                    INDEX `idx_type` (`course_type`),
                                    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训课程表';

-- =====================================================
-- 插入培训课程数据（14门课程完整信息）
-- =====================================================
INSERT INTO `training_courses` (`course_name`, `course_category`, `course_level`, `course_type`, `start_date`, `duration`, `instructor`, `price`, `original_price`, `course_description`, `course_image`, `tags`) VALUES
                                                                                                                                                                                                                      ('童装设计趋势与创新', '设计类', '中级', '线下课程', '2025-09-01', 30, '王教授', 1200.00, 1500.00, '本课程聚焦童装流行趋势与创新设计，帮助学员掌握最新的童装设计理念和方法。课程涵盖2025-2026年童装流行色彩分析、款式设计趋势预测、面料创新应用、图案设计创新等内容。通过大量案例分析和实操练习，提升学员的时尚敏感度与设计能力，培养独立完成童装系列设计的能力。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/design_trend.jpg', '热门'),
                                                                                                                                                                                                                      ('童装打版与工艺', '技术类', '进阶级', '线下课程', '2025-09-10', 24, '李工', 1380.00, 1680.00, '本课程系统讲解童装打版流程与工艺细节，适合有基础的学员提升专业技能。内容包括童装结构原理、尺寸规格体系、纸样制作技术、裁剪工艺、缝制流程、后整理工艺等。通过实际案例演练，让学员掌握从设计图到成品的完整打版流程，能够独立完成各类童装产品的打版工作。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/pattern_making.jpg', '新课'),
                                                                                                                                                                                                                      ('童装电商运营实战', '营销类', '中级', '线上课程', '2025-09-15', 20, '张经理', 980.00, 1280.00, '本课程涵盖电商平台运营、产品上架、活动策划、客户服务全流程实战内容。详细讲解淘宝/天猫、京东、拼多多等主流电商平台的运营规则和技巧，包括店铺装修、产品标题优化、关键词设置、主图设计、详情页制作、爆款打造、活动策划（618、双11等）、客服话术、售后处理等。课程结合真实案例，帮助学员快速提升电商运营能力。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/ecommerce.jpg', '推荐'),
                                                                                                                                                                                                                      ('童装生产管理与质量控制', '管理类', '高级', '线下课程', '2025-09-20', 28, '刘总监', 1380.00, 1780.00, '本课程深入讲解童装生产流程管理、质量标准和效率提升方法。内容涵盖生产计划制定、生产调度管理、流水线设计、工时测定、产能优化、质量管理体系（如ISO9001）、质检流程设置、常见质量问题分析与解决、6S现场管理、成本控制等。结合大量案例分析，帮助学员全面掌握童装生产管理的核心技能。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course4.JPG', NULL),
                                                                                                                                                                                                                      ('童装色彩搭配与流行趋势', '设计类', '入门级', '线上课程', '2025-09-25', 16, '陈老师', 680.00, 980.00, '本课程专为初学者设计，系统讲解童装色彩搭配技巧和流行趋势分析。内容包括色彩基础知识（色相、明度、纯度）、童装配色原则与禁忌、年龄性别色彩偏好、季节色彩搭配、流行色彩趋势预测与分析工具、实用配色方案等。通过大量案例欣赏和练习，帮助学员快速提升色彩敏感度和搭配能力。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course5.jpg', '推荐'),
                                                                                                                                                                                                                      ('童装品牌建设与市场推广', '管理类', '进阶级', '混合式', '2025-10-01', 18, '赵老师', 1080.00, 1380.00, '本课程系统讲解童装品牌定位、品牌故事打造及市场推广策略。内容包括品牌定位理论、目标市场分析、竞品研究、品牌视觉识别系统（VI）设计、品牌传播策略、营销推广渠道选择（线上线下）、品牌活动策划与执行、品牌口碑管理等。通过实际品牌案例分析，帮助学员掌握品牌建设与推广的核心方法。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course6.jpg', '新课'),
                                                                                                                                                                                                                      ('童装面料工艺与创新应用', '技术类', '中级', '线下课程', '2025-10-05', 22, '孙工', 1180.00, 1480.00, '本课程介绍童装常用面料及创新材料，提升学员的面料选择与应用能力。内容包括面料基础知识（纤维原料、织造工艺、染整工艺）、常用童装面料特性分析（纯棉、涤纶、针织、梭织等）、新型环保面料介绍、功能性面料应用、面料采购渠道、面料质量鉴别等。结合实际样品分析和项目实践，帮助学员全面掌握面料知识。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course7.jpg', '热门'),
                                                                                                                                                                                                                      ('童装营销与渠道管理', '营销类', '中级', '线上课程', '2025-10-10', 20, '钱老师', 1080.00, 1380.00, '本课程讲解童装市场营销策略、渠道建设与管理、品牌推广实战技巧。内容包括市场营销理论基础、4P营销策略（产品、价格、渠道、促销）、销售渠道类型与选择（批发、代理、直营、电商等）、经销商管理、渠道冲突处理、线上线下融合策略、私域流量运营、客户关系管理等。帮助学员系统掌握营销与渠道管理技能。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course8.jpg', NULL),
                                                                                                                                                                                                                      ('童装供应链与生产管理', '管理类', '高级', '线下课程', '2025-10-15', 26, '周老师', 1480.00, 1880.00, '本课程从原材料采购到成品交付，系统讲解童装供应链管理全流程。内容包括供应链管理基础、供应商选择与评估、采购谈判技巧、库存管理（安全库存、ABC分类、JIT等）、物流配送优化、供应链风险管控、供应链金融、数字化供应链趋势等。结合知名企业案例，帮助学员全面提升供应链管理能力。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course9.jpg', NULL),
                                                                                                                                                                                                                      ('童装成本控制与预算管理', '管理类', '进阶级', '线上课程', '2025-10-20', 14, '吴老师', 880.00, 1180.00, '本课程帮助学员掌握童装企业成本核算、预算编制与财务管理实务。内容包括成本构成分析（材料成本、人工成本、制造费用）、成本核算方法（品种法、分批法、分步法）、成本控制策略、预算编制流程与方法（零基预算、滚动预算）、财务分析指标、利润核算与定价策略等。注重实战操作，帮助学员快速应用于实际工作中。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course10.jpg', NULL),
                                                                                                                                                                                                                      ('童装创新创业实务', '管理类', '专家级', '混合式', '2025-10-25', 18, '郑老师', 1680.00, 2080.00, '本课程聚焦童装行业创新创业，提供案例分析与实战指导。内容包括童装行业趋势分析、创业机会识别与评估、商业模式设计、创业计划书撰写、融资策略与路演技巧、团队组建与管理、股权分配、创业风险防控、政策解读与资源对接等。邀请成功企业家分享经验，帮助学员实现创业梦想。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course11.jpg', NULL),
                                                                                                                                                                                                                      ('童装外贸实务与国际市场', '营销类', '高级', '线上课程', '2025-11-01', 20, '钱经理', 1580.00, 1980.00, '本课程讲解童装出口流程、国际市场开拓与外贸实务操作。内容包括国际贸易基础知识、出口业务流程（询盘、报价、合同签订、生产、验货、报关、货运）、国际结算方式（TT、LC、DP等）、外贸单证制作、国际市场开拓策略（如阿里国际站、环球资源、展会等）、跨境电商运营、国际物流与货运代理等。帮助学员全面掌握外贸实务技能。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course12.jpg', NULL),
                                                                                                                                                                                                                      ('童装智能制造与数字化转型', '技术类', '专家级', '线下课程', '2025-11-05', 22, '孙博士', 1980.00, 2480.00, '本课程介绍童装生产智能化、数字化管理与行业转型升级案例。内容包括智能制造概念与发展趋势、工业4.0与服装智能制造、数字化转型路径与方法、MES系统应用、自动化设备使用（如自动裁床、自动缝制）、大数据与人工智能在服装行业应用、数字化工厂规划与建设等。结合国内外先进案例，帮助学员把握行业发展方向。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course13.jpg', NULL),
                                                                                                                                                                                                                      ('童装社交媒体营销', '营销类', '进阶级', '线上课程', '2025-11-10', 16, '李老师', 880.00, 1180.00, '本课程讲解新媒体平台运营、内容营销与童装品牌传播技巧。内容包括主流社交媒体平台特性分析（微信、微博、抖音、小红书、快手、B站等）、内容策划与创作、短视频拍摄与剪辑、直播带货技巧、私域流量运营、社群营销、KOL合作策略、品牌传播案例分析等。注重实操演练，帮助学员快速掌握社交媒体营销技能。', 'https://zhili-kids-industry-system.oss-cn-hangzhou.aliyuncs.com/courses/course14.jpg', NULL);

-- =====================================================
-- 培训课程订单表（用户报名课程）
-- =====================================================
DROP TABLE IF EXISTS `training_course_orders`;
CREATE TABLE `training_course_orders` (
                                          `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
                                          `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                                          `course_id` INT NOT NULL COMMENT '课程ID',
                                          `course_name` VARCHAR(100) NOT NULL COMMENT '课程名称（冗余）',
                                          `price` DECIMAL(10,2) NOT NULL COMMENT '实付金额',
                                          `status` VARCHAR(20) DEFAULT 'paid' COMMENT '状态：paid-已支付',
                                          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
                                          INDEX `idx_user_id` (`user_id`),
                                          INDEX `idx_course_id` (`course_id`),
                                          UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
                                          INDEX `idx_created_at` (`created_at`),
                                          FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                                          FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训课程订单表';

-- =====================================================
-- 需求信息表（供应链协同）
-- =====================================================
DROP TABLE IF EXISTS `supply_demands`;
CREATE TABLE `supply_demands` (
                                  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '需求ID',
                                  `demand_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '需求编号（如DM20240101001）',
                                  `title` VARCHAR(200) NOT NULL COMMENT '需求标题',
                                  `type` VARCHAR(50) NOT NULL COMMENT '需求类型：material=原材料, processing=加工服务, design=设计服务, accessory=辅料配件, logistics=物流服务',
                                  `category` VARCHAR(100) NOT NULL COMMENT '需求类别（如：原材料需求、加工服务等）',
                                  `urgency` VARCHAR(20) DEFAULT 'medium' COMMENT '紧急程度：high=紧急, medium=一般, low=不急',
                                  `status` VARCHAR(20) DEFAULT 'open' COMMENT '状态：open=未对接, inprocess=对接中, completed=已完成',
                                  `user_id` VARCHAR(64) NOT NULL COMMENT '发布企业用户ID',
                                  `company_name` VARCHAR(128) NOT NULL COMMENT '需求企业名称',
                                  `contact_name` VARCHAR(64) NOT NULL COMMENT '联系人',
                                  `contact_phone` VARCHAR(32) NOT NULL COMMENT '联系电话',
                                  `email` VARCHAR(128) NOT NULL COMMENT '邮箱',
                                  `location` VARCHAR(100) DEFAULT '浙江省湖州市' COMMENT '所在地区',
                                  `description` TEXT NOT NULL COMMENT '需求描述',
                                  `specifications` TEXT DEFAULT NULL COMMENT '规格要求（JSON格式存储）',
                                  `budget` VARCHAR(100) DEFAULT NULL COMMENT '预算范围',
                                  `deadline` DATE DEFAULT NULL COMMENT '截止日期',
                                  `publish_date` DATE NOT NULL COMMENT '发布日期',
                                  `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签（逗号分隔）',
                                  `requirements` TEXT DEFAULT NULL COMMENT '具体要求（多行文本）',
                                  `view_count` INT DEFAULT 0 COMMENT '浏览次数',
                                  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                  INDEX `idx_demand_id` (`demand_id`),
                                  INDEX `idx_user_id` (`user_id`),
                                  INDEX `idx_type` (`type`),
                                  INDEX `idx_status` (`status`),
                                  INDEX `idx_urgency` (`urgency`),
                                  INDEX `idx_publish_date` (`publish_date`),
                                  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='需求信息表';

-- =====================================================
-- 供应信息表（供应链协同）
-- =====================================================
DROP TABLE IF EXISTS `supply_supplies`;
CREATE TABLE `supply_supplies` (
                                   `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '供应ID',
                                   `supply_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '供应编号（如SP20240101001）',
                                   `title` VARCHAR(200) NOT NULL COMMENT '供应标题',
                                   `type` VARCHAR(50) NOT NULL COMMENT '供应类型：material=原材料, processing=加工服务, design=设计服务, accessory=辅料配件, logistics=物流服务',
                                   `category` VARCHAR(100) NOT NULL COMMENT '供应类别（如：原材料供应、加工服务等）',
                                   `status` VARCHAR(20) DEFAULT 'available' COMMENT '状态：available=可供应',
                                   `user_id` VARCHAR(64) NOT NULL COMMENT '发布企业用户ID',
                                   `company_name` VARCHAR(128) NOT NULL COMMENT '供应企业名称',
                                   `contact_name` VARCHAR(64) NOT NULL COMMENT '联系人',
                                   `contact_phone` VARCHAR(32) NOT NULL COMMENT '联系电话',
                                   `email` VARCHAR(128) NOT NULL COMMENT '邮箱',
                                   `location` VARCHAR(100) DEFAULT '浙江省湖州市' COMMENT '所在地区',
                                   `description` TEXT NOT NULL COMMENT '供应描述',
                                   `specifications` TEXT DEFAULT NULL COMMENT '规格说明（JSON格式存储）',
                                   `price` VARCHAR(100) DEFAULT NULL COMMENT '价格范围',
                                   `capacity` VARCHAR(100) DEFAULT NULL COMMENT '产能说明',
                                   `publish_date` DATE NOT NULL COMMENT '发布日期',
                                   `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签（逗号分隔）',
                                   `advantages` TEXT DEFAULT NULL COMMENT '优势说明（多行文本）',
                                   `certifications` VARCHAR(500) DEFAULT NULL COMMENT '认证信息（逗号分隔）',
                                   `view_count` INT DEFAULT 0 COMMENT '浏览次数',
                                   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                   INDEX `idx_supply_id` (`supply_id`),
                                   INDEX `idx_user_id` (`user_id`),
                                   INDEX `idx_type` (`type`),
                                   INDEX `idx_status` (`status`),
                                   INDEX `idx_publish_date` (`publish_date`),
                                   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应信息表';

-- =====================================================
-- 供需附件表（存储需求/供应的附件文档）
-- =====================================================
DROP TABLE IF EXISTS `supply_attachments`;
CREATE TABLE `supply_attachments` (
                                      `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
                                      `demand_id` INT DEFAULT NULL COMMENT '关联需求ID（如果属于需求）',
                                      `supply_id` INT DEFAULT NULL COMMENT '关联供应ID（如果属于供应）',
                                      `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
                                      `file_size` VARCHAR(50) DEFAULT NULL COMMENT '文件大小（如：2.3MB）',
                                      `file_url` VARCHAR(512) DEFAULT NULL COMMENT '文件URL（OSS地址）',
                                      `file_type` VARCHAR(50) DEFAULT NULL COMMENT '文件类型（如：pdf, jpg, xlsx等）',
                                      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                      INDEX `idx_demand_id` (`demand_id`),
                                      INDEX `idx_supply_id` (`supply_id`),
                                      FOREIGN KEY (`demand_id`) REFERENCES `supply_demands`(`id`) ON DELETE CASCADE,
                                      FOREIGN KEY (`supply_id`) REFERENCES `supply_supplies`(`id`) ON DELETE CASCADE,
                                      CHECK (`demand_id` IS NOT NULL OR `supply_id` IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供需附件表';

-- =====================================================
-- 供需对接记录表
-- =====================================================
DROP TABLE IF EXISTS `supply_connections`;
CREATE TABLE `supply_connections` (
                                      `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '对接ID',
                                      `connection_id` VARCHAR(32) NOT NULL UNIQUE COMMENT '对接编号（如CN20240101001）',
                                      `demand_id` INT DEFAULT NULL COMMENT '需求ID（需求方发起对接时填写）',
                                      `supply_id` INT DEFAULT NULL COMMENT '供应ID（供应方发起对接时填写）',
                                      `demand_user_id` VARCHAR(64) DEFAULT NULL COMMENT '需求发布者用户ID',
                                      `supply_user_id` VARCHAR(64) DEFAULT NULL COMMENT '供应发布者用户ID',
                                      `status` VARCHAR(20) DEFAULT 'negotiating' COMMENT '对接状态：negotiating=洽谈中, completed=已完成, cancelled=已取消',
                                      `start_date` DATE NOT NULL COMMENT '开始日期',
                                      `last_update` DATE DEFAULT NULL COMMENT '最后更新日期',
                                      `completed_date` DATE DEFAULT NULL COMMENT '完成日期',
                                      `notes` TEXT DEFAULT NULL COMMENT '备注说明',
                                      `applicant_user_id` VARCHAR(64) DEFAULT NULL COMMENT '申请对接的用户ID',
                                      `applicant_company_name` VARCHAR(128) DEFAULT NULL COMMENT '申请企业名称',
                                      `applicant_contact_name` VARCHAR(64) DEFAULT NULL COMMENT '申请联系人',
                                      `applicant_contact_phone` VARCHAR(32) DEFAULT NULL COMMENT '申请联系人电话',
                                      `applicant_contact_email` VARCHAR(128) DEFAULT NULL COMMENT '申请联系人邮箱',
                                      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                      `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                      INDEX `idx_connection_id` (`connection_id`),
                                      INDEX `idx_demand_id` (`demand_id`),
                                      INDEX `idx_supply_id` (`supply_id`),
                                      INDEX `idx_demand_user_id` (`demand_user_id`),
                                      INDEX `idx_supply_user_id` (`supply_user_id`),
                                      INDEX `idx_status` (`status`),
                                      INDEX `idx_applicant_user_id` (`applicant_user_id`),
                                      INDEX `idx_demand_supply` (`demand_id`, `supply_id`),
                                      FOREIGN KEY (`demand_id`) REFERENCES `supply_demands`(`id`) ON DELETE SET NULL,
                                      FOREIGN KEY (`supply_id`) REFERENCES `supply_supplies`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供需对接记录表';

-- chat_messages.connection_id 依赖 supply_connections，须在对接表创建后补外键
ALTER TABLE `chat_messages`
    ADD CONSTRAINT `fk_chat_messages_supply_connection`
        FOREIGN KEY (`connection_id`) REFERENCES `supply_connections`(`id`) ON DELETE SET NULL;

-- =====================================================
-- 插入需求信息数据（8条需求）
-- =====================================================
INSERT INTO `supply_demands` (`demand_id`, `title`, `type`, `category`, `urgency`, `status`, `user_id`, `company_name`, `contact_name`, `contact_phone`, `email`, `location`, `description`, `specifications`, `budget`, `deadline`, `publish_date`, `tags`, `requirements`) VALUES
                                                                                                                                                                                                                                                                                 ('DM20240101001', '高品质全棉针织面料采购需求', 'material', '原材料需求', 'high', 'open', 'ent001', '浙江童趣服饰有限公司', '张经理', '0571-88888888', 'zhang@tongqu.com', '浙江省湖州市', '采购40支全棉针织面料，用于2023秋冬款童装生产，颜色要求：白色、浅蓝、粉红，规格：175cm宽，每色各需5000米。', '{"material":"全棉","count":"40支","width":"175cm","colors":["白色","浅蓝","粉红"],"quantity":"15000米","usage":"童装生产"}', '150000-200000', '2024-02-15', '2024-01-10', '全棉,针织面料,40支', '面料质量符合国家童装标准\n色牢度达到4级以上\n甲醛含量低于20mg/kg\n支持小批量试样\n交货期不超过15天'),
                                                                                                                                                                                                                                                                                 ('DM20240102002', '童装印花加工服务需求', 'processing', '加工服务', 'medium', 'inprocess', 'ent002', '湖州小森林童装设计工作室', '李设计师', '0572-3333333', 'li@xiaoshenlin.com', '浙江省湖州市', '寻找童装数码印花加工厂，可承接小批量定制印花，要求环保无毒，色牢度高，交货周期短。', '{"printType":"数码印花","fabric":"纯棉、棉混纺","colors":"多色印花","quantity":"500-2000件/批","size":"80-160码"}', '8-15元/件', '2024-03-01', '2024-01-12', '数码印花,环保,小批量', '使用环保水性墨水\n色牢度达到3-4级\n支持个性化定制\n交货周期7-10天\n提供打样服务'),
                                                                                                                                                                                                                                                                                 ('DM20240103003', '2024春夏童装设计服务需求', 'design', '设计服务', 'low', 'open', 'ent004', '快乐童年服饰有限公司', '王总', '0572-5555555', 'wang@happykids.com', '浙江省湖州市', '寻找专业童装设计师，为2024春夏季设计10款0-3岁婴幼儿服装，主题为"自然探索"，设计风格简约自然。', '{"ageGroup":"0-3岁","season":"春夏","style":"简约自然","theme":"自然探索","quantity":"10款","gender":"男女童通用"}', '5000-8000元/款', '2024-04-30', '2024-01-15', '婴幼儿,春夏,设计服务', '具有3年以上童装设计经验\n熟悉婴幼儿服装安全标准\n提供完整设计方案\n包含款式图、工艺单\n支持后续打样指导'),
                                                                                                                                                                                                                                                                                 ('DM20240104004', '童装纽扣配件批量采购', 'accessory', '辅料配件', 'high', 'open', 'ent001', '织里童装制造有限公司', '陈采购', '0572-7777777', 'chen@zhili-kids.com', '浙江省湖州市', '需要采购各种规格的童装纽扣，包括塑料扣、金属扣、木质扣等，用于春夏童装生产。', '{"materials":["塑料","金属","木质"],"sizes":["10mm","12mm","15mm","18mm"],"colors":"多色可选","quantity":"100000个","packaging":"按规格分装"}', '0.1-0.5元/个', '2024-02-20', '2024-01-08', '纽扣,配件,批量采购', '符合童装安全标准\n无尖锐边角\n色牢度稳定\n支持定制LOGO\n包装完整无损'),
                                                                                                                                                                                                                                                                                 ('DM20240105005', '童装物流配送服务需求', 'logistics', '物流服务', 'medium', 'open', 'ent006', '江南童装贸易公司', '刘经理', '0572-9999999', 'liu@jiangnan-kids.com', '浙江省湖州市', '寻找专业的童装物流配送服务商，覆盖华东地区，要求时效快、包装好、价格合理。', '{"coverage":"华东地区","serviceType":"仓储+配送","timeLimit":"24-48小时","packaging":"专业童装包装","tracking":"全程可追踪"}', '8-12元/件', '2024-03-15', '2024-01-20', '物流,配送,华东', '具有童装物流经验\n仓储环境干净整洁\n包装专业美观\n时效稳定可靠\n价格透明合理'),
                                                                                                                                                                                                                                                                                 ('DM20240106006', '童装拉链批量采购需求', 'accessory', '辅料配件需求', 'medium', 'open', 'ent004', '小天使童装有限公司', '刘经理', '0572-8888999', 'liu@xiaotianshi.com', '浙江省湖州市', '需要采购各种规格的童装拉链，包括尼龙拉链、金属拉链、隐形拉链等，用于秋冬童装生产。', '{"materials":["尼龙","金属","树脂"],"lengths":["15cm","20cm","25cm","30cm"],"colors":["黑色","白色","彩色"],"quantity":"50000条","quality":"A级品"}', '1.5-3元/条', '2024-03-15', '2024-01-18', '拉链,配件,童装', '符合童装安全标准\n拉合顺滑无卡顿\n色牢度稳定\n支持定制长度\n包装规范整齐'),
                                                                                                                                                                                                                                                                                 ('DM20240107007', '童装绣花加工服务需求', 'processing', '加工服务需求', 'low', 'open', 'ent002', '梦幻童年服饰', '周设计师', '0572-7778888', 'zhou@menghuantn.com', '浙江省湖州市', '寻找专业的童装绣花加工厂，能够承接精细绣花工艺，包括电脑绣花、手工绣花等。', '{"embroideryTypes":["电脑绣花","手工绣花","贴布绣"],"fabrics":["棉质","丝绸","混纺"],"colors":"多色绣花","quantity":"1000-5000件/批","complexity":"中高复杂度"}', '10-30元/件', '2024-04-20', '2024-01-20', '绣花,手工艺,精细加工', '绣花工艺精细\n色彩搭配协调\n支持个性化定制\n交货期稳定\n提供样品确认'),
                                                                                                                                                                                                                                                                                 ('DM20240108008', '环保童装面料采购', 'material', '原材料需求', 'high', 'open', 'ent007', '绿色童装制造有限公司', '马总监', '0572-9999000', 'ma@green-kids.com', '浙江省湖州市', '采购符合GOTS认证的有机棉面料，用于高端环保童装生产线，要求无化学残留。', '{"material":"有机棉","certification":"GOTS认证","weight":"160-220g/m²","width":"150cm","colors":["本白","天然彩棉"],"quantity":"20000米"}', '45-65元/米', '2024-02-28', '2024-01-22', '有机棉,GOTS认证,环保', 'GOTS有机认证\n无化学残留\n可追溯原料来源\n提供认证证书\n支持小批量试订');

-- =====================================================
-- 插入供应信息数据（7条供应）
-- =====================================================
INSERT INTO `supply_supplies` (`supply_id`, `title`, `type`, `category`, `status`, `user_id`, `company_name`, `contact_name`, `contact_phone`, `email`, `location`, `description`, `specifications`, `price`, `capacity`, `publish_date`, `tags`, `advantages`, `certifications`) VALUES
                                                                                                                                                                                                                                                                                      ('SP20240101001', '优质童装面料供应', 'material', '原材料供应', 'available', 'ent003', '湖州优质纺织有限公司', '赵厂长', '0572-2222222', 'zhao@youzhifz.com', '浙江省湖州市', '专业生产各类童装面料，包括全棉、棉混纺、功能性面料等，质量稳定，价格优惠。', '{"materials":["全棉","棉混纺","功能性面料"],"width":"150-180cm","weight":"120-200g/m²","colors":"常规色+定制色","minOrder":"1000米/色"}', '18-35元/米', '月产能50万米', '2024-01-05', '童装面料,全棉,环保', '20年童装面料生产经验\nOEKO-TEX认证\n快速打样服务\n稳定供货能力\n技术支持完善', 'OEKO-TEX,GOTS,ISO9001'),
                                                                                                                                                                                                                                                                                      ('SP20240102002', '专业童装印花加工', 'processing', '加工服务', 'available', 'ent009', '织里印花工艺厂', '孙师傅', '0572-4444444', 'sun@zhiliprint.com', '浙江省湖州市', '专业从事童装印花加工，拥有先进的数码印花设备，环保工艺，交货快速。', '{"printTypes":["数码印花","丝网印花","热转印"],"fabrics":["棉质","混纺","功能面料"],"colors":"无限色彩","minOrder":"100件起","maxSize":"A3幅面"}', '5-20元/件', '日产能2000件', '2024-01-08', '印花加工,数码印花,环保', '15年印花加工经验\n环保水性墨水\n色彩还原度高\n交货周期短\n支持小批量定制', '环保认证,ISO14001'),
                                                                                                                                                                                                                                                                                      ('SP20240103003', '童装设计工作室', 'design', '设计服务', 'available', 'ent010', '创意童装设计工作室', '林设计师', '0572-6666666', 'lin@creative-kids.com', '浙江省湖州市', '专业童装设计团队，擅长0-12岁童装设计，风格多样，创意新颖，服务周到。', '{"ageRange":"0-12岁","styles":["休闲","正装","运动","时尚"],"services":["款式设计","工艺指导","打样跟进"],"deliverables":["设计图","工艺单","面料建议"],"timeline":"7-15天/款"}', '3000-10000元/款', '月设计能力30款', '2024-01-10', '童装设计,创意,专业', '10年童装设计经验\n获得多项设计奖项\n深谙儿童心理\n紧跟时尚潮流\n一对一服务', '设计师资格证,版权保护'),
                                                                                                                                                                                                                                                                                      ('SP20240104004', '童装配件一站式供应', 'accessory', '辅料配件供应', 'available', 'ent012', '织里配件批发中心', '钱老板', '0572-5555777', 'qian@zhili-accessories.com', '浙江省湖州市', '专业供应各类童装配件，包括纽扣、拉链、织带、标签等，品种齐全，价格优惠。', '{"products":["纽扣","拉链","织带","标签","魔术贴"],"materials":["塑料","金属","尼龙","棉质"],"colors":"全色系可选","minOrder":"1000个起","customization":"支持定制"}', '0.1-5元/个', '月供应能力100万个', '2024-01-12', '配件,批发,一站式', '15年配件供应经验\n品种齐全库存充足\n价格优势明显\n支持小批量采购\n快速发货服务', '质量管理体系认证'),
                                                                                                                                                                                                                                                                                      ('SP20240105005', '专业童装物流配送', 'logistics', '物流服务', 'available', 'ent016', '快捷童装物流有限公司', '运营部', '0572-6666888', 'service@kuaijie-logistics.com', '浙江省湖州市', '专注童装行业物流配送，覆盖全国主要城市，提供仓储、包装、配送一体化服务。', '{"services":["仓储管理","包装服务","配送运输","代收货款"],"coverage":"全国主要城市","timeLimit":"24-72小时","packaging":"专业童装包装","tracking":"全程跟踪"}', '8-25元/件', '日处理能力5万件', '2024-01-15', '物流,配送,仓储', '专业童装物流经验\n全国网络覆盖\n时效稳定可靠\n包装专业美观\n价格透明合理', '物流企业资质,安全认证'),
                                                                                                                                                                                                                                                                                      ('SP20240106006', '高端童装绣花工艺', 'processing', '加工服务', 'available', 'ent009', '艺术绣花工作室', '李师傅', '0572-7777999', 'li@art-embroidery.com', '浙江省湖州市', '专业从事高端童装绣花加工，拥有精湛的手工绣花技艺和先进的电脑绣花设备。', '{"techniques":["手工绣花","电脑绣花","立体绣","珠片绣"],"fabrics":["丝绸","棉质","毛料","混纺"],"complexity":"简单到复杂全覆盖","minOrder":"50件起","sampleTime":"3-5天"}', '15-80元/件', '月加工能力8000件', '2024-01-18', '绣花,手工艺,高端', '20年绣花工艺经验\n获得多项工艺奖项\n手工与机器结合\n个性化定制服务\n质量精益求精', '工艺美术师证书,质量认证'),
                                                                                                                                                                                                                                                                                      ('SP20240107007', '环保有机棉面料供应', 'material', '原材料供应', 'available', 'ent007', '绿色纺织科技有限公司', '环保部经理', '0572-8888777', 'eco@green-textile.com', '浙江省湖州市', '专业生产GOTS认证有机棉面料，无化学残留，适合高端环保童装制造。', '{"material":"100%有机棉","certifications":["GOTS","OCS","OEKO-TEX"],"weight":"120-300g/m²","width":"150-180cm","colors":"天然色+环保染色","minOrder":"500米/色"}', '35-75元/米', '月产能20万米', '2024-01-20', '有机棉,GOTS认证,环保', 'GOTS全球有机认证\n可追溯原料来源\n零化学残留\n环保染色工艺\n支持定制开发', 'GOTS,OCS,OEKO-TEX,ISO14001');

-- =====================================================
-- 插入供需对接记录数据（2条对接记录）
-- =====================================================
INSERT INTO `supply_connections` (`connection_id`, `demand_id`, `supply_id`, `demand_user_id`, `supply_user_id`, `status`, `start_date`, `last_update`, `completed_date`, `notes`, `applicant_user_id`, `applicant_company_name`) VALUES
                                                                                                                                                                                                                                      ('CN20240101001', 2, NULL, 'ent002', NULL, 'negotiating', '2024-01-15', '2024-01-20', NULL, '双方已初步达成合作意向，正在商讨具体价格和交货期', 'ent002', '湖州小森林童装设计工作室'),
                                                                                                                                                                                                                                      ('CN20240102002', 1, NULL, 'ent001', NULL, 'completed', '2024-01-12', '2024-01-18', '2024-01-18', '合作成功，已签订供货协议', 'ent001', '浙江童趣服饰有限公司');

-- =====================================================
-- 站内通知表（企业供需对接、简历投递等事件通知）
-- =====================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
                                 `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
                                 `user_id` VARCHAR(64) NOT NULL COMMENT '通知接收人用户ID',
                                 `type` VARCHAR(32) NOT NULL COMMENT '通知类型：supply_connection_created=收到对接申请, connection_status_changed=对接状态变更, job_application_received=收到简历投递',
                                 `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
                                 `content` TEXT DEFAULT NULL COMMENT '通知内容摘要',
                                 `related_id` INT DEFAULT NULL COMMENT '关联业务ID（对接记录ID或职位申请ID）',
                                 `related_type` VARCHAR(32) DEFAULT NULL COMMENT '关联业务类型：connection / job_application',
                                 `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读：0=未读，1=已读',
                                 `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
                                 INDEX `idx_user_id` (`user_id`),
                                 INDEX `idx_user_read` (`user_id`, `is_read`),
                                 INDEX `idx_created` (`created_at`),
                                 FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内通知表';

-- =====================================================
-- 插入供需附件数据（为需求和供应添加附件文档）
-- =====================================================
INSERT INTO `supply_attachments` (`demand_id`, `supply_id`, `file_name`, `file_size`, `file_url`, `file_type`, `created_at`) VALUES
-- 需求附件
(1, NULL, '面料规格书.pdf', '2.3MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(1, NULL, '色卡参考.jpg', '1.8MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'jpg', NOW()),
(2, NULL, '印花工艺要求.pdf', '1.5MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(3, NULL, '设计需求文档.pdf', '2.0MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(4, NULL, '纽扣规格表.xlsx', '0.8MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'xlsx', NOW()),
(5, NULL, '物流服务协议.pdf', '1.2MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(6, NULL, '拉链样品图.jpg', '1.5MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'jpg', NOW()),
(7, NULL, '绣花工艺说明.pdf', '1.8MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(8, NULL, 'GOTS认证证书.pdf', '2.5MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
-- 供应附件
(NULL, 1, '面料产品目录.pdf', '3.2MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(NULL, 1, '面料色卡.jpg', '2.1MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'jpg', NOW()),
(NULL, 2, '印花工艺展示.pdf', '2.8MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(NULL, 2, '印花样品图.jpg', '1.9MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'jpg', NOW()),
(NULL, 3, '设计作品集.pdf', '4.5MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(NULL, 4, '配件产品目录.xlsx', '1.2MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'xlsx', NOW()),
(NULL, 5, '物流服务介绍.pdf', '1.8MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(NULL, 6, '绣花工艺展示.pdf', '2.3MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW()),
(NULL, 6, '绣花样品图.jpg', '2.0MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'jpg', NOW()),
(NULL, 7, '有机棉认证证书.pdf', '3.0MB', 'https://yingyezhizhao-zhili-kids-system.oss-cn-beijing.aliyuncs.com/licenses/company-logo14.jpg', 'pdf', NOW());

-- =====================================================
-- 产品收藏表
-- =====================================================
DROP TABLE IF EXISTS `product_favorites`;
CREATE TABLE `product_favorites` (
                                     `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
                                     `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                                     `product_id` VARCHAR(20) NOT NULL COMMENT '产品ID',
                                     `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
                                     UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
                                     INDEX `idx_user_id` (`user_id`),
                                     INDEX `idx_product_id` (`product_id`),
                                     FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                                     FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品收藏表';

-- =====================================================
-- 商品评价表
-- =====================================================
DROP TABLE IF EXISTS `product_reviews`;
CREATE TABLE `product_reviews` (
                                   `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '评价ID',
                                   `order_id` VARCHAR(32) DEFAULT NULL COMMENT '订单ID',
                                   `order_item_id` INT DEFAULT NULL COMMENT '订单项ID',
                                   `product_id` VARCHAR(20) NOT NULL COMMENT '产品ID',
                                   `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                                   `rating` TINYINT NOT NULL COMMENT '评分（1-5）',
                                   `content` TEXT NOT NULL COMMENT '评价内容',
                                   `images` VARCHAR(1000) DEFAULT NULL COMMENT '评价图片（JSON数组）',
                                   `reply_content` TEXT DEFAULT NULL COMMENT '商家回复内容',
                                   `reply_time` DATETIME DEFAULT NULL COMMENT '商家回复时间',
                                   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
                                   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                   INDEX `idx_product_id` (`product_id`),
                                   INDEX `idx_user_id` (`user_id`),
                                   INDEX `idx_order_item_id` (`order_item_id`),
                                   INDEX `idx_created_at` (`created_at`),
                                   FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
                                   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品评价表';
-- =====================================================
-- 企业关注表
-- =====================================================
DROP TABLE IF EXISTS `enterprise_follows`;
CREATE TABLE `enterprise_follows` (
                                      `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '关注ID',
                                      `user_id` VARCHAR(64) NOT NULL COMMENT '关注者用户ID',
                                      `enterprise_id` VARCHAR(64) NOT NULL COMMENT '被关注企业用户ID',
                                      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
                                      UNIQUE KEY `uk_user_enterprise` (`user_id`, `enterprise_id`),
                                      INDEX `idx_user_id` (`user_id`),
                                      INDEX `idx_enterprise_id` (`enterprise_id`),
                                      FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                                      FOREIGN KEY (`enterprise_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业关注表';

-- =====================================================
-- 插入示例数据
-- =====================================================
INSERT INTO `enterprise_follows` (`user_id`, `enterprise_id`) VALUES
                                                                  ('user001', 'ent001'),
                                                                  ('user002', 'ent002'),
                                                                  ('user003', 'ent001');
-- =====================================================
-- 课程评价表
-- =====================================================
DROP TABLE IF EXISTS `course_reviews`;
CREATE TABLE `course_reviews` (
                                  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '评价ID',
                                  `course_id` INT NOT NULL COMMENT '课程ID',
                                  `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
                                  `rating` INT NOT NULL DEFAULT 5 COMMENT '评分（1-5）',
                                  `content` TEXT COMMENT '评价内容',
                                  `reply_content` TEXT COMMENT '机构回复内容',
                                  `reply_time` DATETIME COMMENT '机构回复时间',
                                  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
                                  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                  INDEX `idx_course_id` (`course_id`),
                                  INDEX `idx_user_id` (`user_id`),
                                  FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON DELETE CASCADE,
                                  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程评价表';
