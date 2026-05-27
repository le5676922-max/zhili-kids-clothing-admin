-- =====================================================
-- 库存管理相关表
-- 使用前请先执行 init.sql 创建基础表
-- =====================================================

-- 仓库表
DROP TABLE IF EXISTS `inventory_warehouses`;
CREATE TABLE `inventory_warehouses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(128) NOT NULL COMMENT '仓库名称',
    `address` VARCHAR(255) DEFAULT NULL COMMENT '仓库地址',
    `manager` VARCHAR(64) DEFAULT NULL COMMENT '仓库管理员',
    `contact_phone` VARCHAR(32) DEFAULT NULL COMMENT '联系电话',
    `capacity` INT DEFAULT 0 COMMENT '容量',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0=停用，1=启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仓库表';

-- 供应商表
DROP TABLE IF EXISTS `inventory_suppliers`;
CREATE TABLE `inventory_suppliers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(128) NOT NULL COMMENT '供应商名称',
    `contact_person` VARCHAR(64) DEFAULT NULL COMMENT '联系人',
    `contact_phone` VARCHAR(32) DEFAULT NULL COMMENT '联系电话',
    `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0=停用，1=启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商表';

-- 库存产品表
DROP TABLE IF EXISTS `inventory_products`;
CREATE TABLE `inventory_products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_code` VARCHAR(32) NOT NULL UNIQUE COMMENT '产品编码',
    `name` VARCHAR(200) NOT NULL COMMENT '产品名称',
    `spec` VARCHAR(100) DEFAULT NULL COMMENT '规格型号',
    `category` VARCHAR(50) DEFAULT NULL COMMENT '分类：raw_material=原材料, accessory=辅料, finished=成品',
    `unit` VARCHAR(20) DEFAULT NULL COMMENT '单位',
    `price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '单价',
    `stock` INT DEFAULT 0 COMMENT '当前库存量',
    `min_stock` INT DEFAULT 0 COMMENT '最低库存预警',
    `warehouse_id` INT DEFAULT NULL COMMENT '所属仓库ID',
    `supplier_id` INT DEFAULT NULL COMMENT '供应商ID',
    `remark` TEXT DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_warehouse` (`warehouse_id`),
    INDEX `idx_category` (`category`),
    INDEX `idx_stock` (`stock`),
    FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `inventory_suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存产品表';

-- 入库记录表
DROP TABLE IF EXISTS `inventory_inbound_records`;
CREATE TABLE `inventory_inbound_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '入库单号',
    `inbound_date` DATE NOT NULL COMMENT '入库日期',
    `supplier_id` INT DEFAULT NULL COMMENT '供应商ID',
    `warehouse_id` INT DEFAULT NULL COMMENT '仓库ID',
    `products` JSON DEFAULT NULL COMMENT '入库产品列表',
    `total_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '总金额',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending=待审批, approved=已审批, completed=已完成',
    `operator` VARCHAR(64) DEFAULT NULL COMMENT '操作人',
    `remark` TEXT DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_record_no` (`record_no`),
    INDEX `idx_supplier` (`supplier_id`),
    INDEX `idx_warehouse` (`warehouse_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_date` (`inbound_date`),
    FOREIGN KEY (`supplier_id`) REFERENCES `inventory_suppliers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='入库记录表';

-- 出库记录表
DROP TABLE IF EXISTS `inventory_outbound_records`;
CREATE TABLE `inventory_outbound_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '出库单号',
    `outbound_date` DATE NOT NULL COMMENT '出库日期',
    `type` VARCHAR(20) NOT NULL COMMENT '出库类型：sale=销售, production=生产领用, transfer=调拨出库, other=其他',
    `warehouse_id` INT DEFAULT NULL COMMENT '仓库ID',
    `target_name` VARCHAR(128) DEFAULT NULL COMMENT '出库对象（客户/部门名称）',
    `products` JSON DEFAULT NULL COMMENT '出库产品列表',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending=待审批, approved=已审批, completed=已完成',
    `operator` VARCHAR(64) DEFAULT NULL COMMENT '操作人',
    `remark` TEXT DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_record_no` (`record_no`),
    INDEX `idx_type` (`type`),
    INDEX `idx_warehouse` (`warehouse_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_date` (`outbound_date`),
    FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出库记录表';

-- 调拨记录表
DROP TABLE IF EXISTS `inventory_transfer_records`;
CREATE TABLE `inventory_transfer_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_no` VARCHAR(32) NOT NULL UNIQUE COMMENT '调拨单号',
    `transfer_date` DATE NOT NULL COMMENT '调拨日期',
    `from_warehouse_id` INT DEFAULT NULL COMMENT '调出仓库ID',
    `to_warehouse_id` INT DEFAULT NULL COMMENT '调入仓库ID',
    `products` JSON DEFAULT NULL COMMENT '调拨产品列表',
    `reason` VARCHAR(50) DEFAULT 'balance' COMMENT '调拨原因：balance=库存平衡, shortage=缺货调拨, maintenance=维修, other=其他',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending=待审批, approved=已审批, completed=已完成',
    `operator` VARCHAR(64) DEFAULT NULL COMMENT '操作人',
    `remark` TEXT DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_record_no` (`record_no`),
    INDEX `idx_from_warehouse` (`from_warehouse_id`),
    INDEX `idx_to_warehouse` (`to_warehouse_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_date` (`transfer_date`),
    FOREIGN KEY (`from_warehouse_id`) REFERENCES `inventory_warehouses`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`to_warehouse_id`) REFERENCES `inventory_warehouses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='调拨记录表';

-- =====================================================
-- 插入基础数据
-- =====================================================

-- 仓库基础数据
INSERT INTO `inventory_warehouses` (`name`, `address`, `manager`, `contact_phone`, `capacity`, `status`) VALUES
('主仓库', '织里镇中心仓储区1号', '赵仓管', '0572-1111111', 5000, 1),
('原料仓库', '织里镇原料存储区2号', '钱仓管', '0572-2222222', 3000, 1),
('成品仓库', '织里镇成品存储区3号', '孙仓管', '0572-3333333', 4000, 1);

-- 供应商基础数据
INSERT INTO `inventory_suppliers` (`name`, `contact_person`, `contact_phone`, `address`, `status`) VALUES
('织里优质面料有限公司', '张经理', '0572-3856789', '湖州市织里镇工业园区A区', 1),
('湖州印艺数码科技有限公司', '李总', '0572-3967890', '湖州市织里镇数码印花园', 1),
('浙江童装辅料供应商', '王主管', '0572-3745612', '湖州市织里镇辅料市场B栋', 1),
('江苏优质纺织有限公司', '陈经理', '0512-6789012', '江苏省苏州市纺织工业园', 1),
('广东童装配件厂', '刘总监', '0769-8901234', '广东省东莞市童装产业园', 1);

-- 库存产品基础数据
INSERT INTO `inventory_products` (`product_code`, `name`, `spec`, `category`, `unit`, `price`, `stock`, `min_stock`, `warehouse_id`, `supplier_id`) VALUES
('P001', '有机棉针织面料', '32支', 'raw_material', '米', 25.50, 150, 100, 2, 1),
('P002', '童装印花面料', '40支', 'raw_material', '米', 32.80, 89, 80, 1, 2),
('P003', '纽扣配件', '12mm', 'accessory', '个', 0.50, 500, 200, 1, 3),
('P004', '拉链配件', '20cm', 'accessory', '条', 2.30, 280, 150, 1, 3),
('P005', '童装T恤', '110-160码', 'finished', '件', 45.00, 120, 50, 3, NULL),
('P006', '童装连衣裙', '110-150码', 'finished', '件', 68.00, 85, 50, 3, NULL),
('P007', '弹力牛仔面料', '12oz', 'raw_material', '米', 28.90, 200, 100, 2, 1),
('P008', '童装外套', '120-170码', 'finished', '件', 89.00, 65, 50, 3, NULL),
('P009', '绣花线', '多色', 'accessory', '卷', 3.20, 350, 100, 1, 3),
('P010', '童装短裤', '110-160码', 'finished', '件', 35.00, 95, 50, 3, NULL),
('P011', '纯棉里布', '平纹', 'raw_material', '米', 18.50, 180, 80, 2, 1),
('P012', '魔术贴', '2cm宽', 'accessory', '米', 1.80, 120, 100, 1, 3);

-- 入库记录基础数据
INSERT INTO `inventory_inbound_records` (`record_no`, `inbound_date`, `supplier_id`, `warehouse_id`, `products`, `total_amount`, `status`, `operator`) VALUES
('RK20240101001', '2024-01-15', 1, 2, '[{"productId":1,"quantity":100,"price":25.50}]', 2550.00, 'completed', '张三'),
('RK20240102002', '2024-01-16', 2, 1, '[{"productId":2,"quantity":50,"price":32.80}]', 1640.00, 'approved', '李四'),
('RK20240103003', '2024-01-17', 3, 1, '[{"productId":3,"quantity":200,"price":0.50}]', 100.00, 'pending', '王五'),
('RK20240104004', '2024-01-18', 1, 2, '[{"productId":7,"quantity":80,"price":28.90}]', 2312.00, 'completed', '张三'),
('RK20240105005', '2024-01-19', 3, 1, '[{"productId":4,"quantity":150,"price":2.30}]', 345.00, 'approved', '赵六');

-- 出库记录基础数据
INSERT INTO `inventory_outbound_records` (`record_no`, `outbound_date`, `type`, `warehouse_id`, `target_name`, `products`, `status`, `operator`) VALUES
('CK20240101001', '2024-01-15', 'sale', 3, '杭州童装批发市场', '[{"productId":5,"quantity":20}]', 'completed', '销售员A'),
('CK20240102002', '2024-01-16', 'production', 2, '生产部', '[{"productId":1,"quantity":30}]', 'completed', '生产员B'),
('CK20240103003', '2024-01-17', 'sale', 3, '上海儿童服饰连锁店', '[{"productId":6,"quantity":15}]', 'approved', '销售员C'),
('CK20240104004', '2024-01-18', 'production', 1, '生产部', '[{"productId":3,"quantity":50}]', 'completed', '生产员D'),
('CK20240105005', '2024-01-19', 'sale', 3, '北京童装专卖店', '[{"productId":8,"quantity":10}]', 'completed', '销售员E');

-- 调拨记录基础数据
INSERT INTO `inventory_transfer_records` (`record_no`, `transfer_date`, `from_warehouse_id`, `to_warehouse_id`, `products`, `reason`, `status`, `operator`) VALUES
('DB20240101001', '2024-01-15', 1, 2, '[{"productId":3,"quantity":50}]', 'balance', 'completed', '调拨员A'),
('DB20240102002', '2024-01-16', 2, 3, '[{"productId":1,"quantity":20}]', 'shortage', 'approved', '调拨员B'),
('DB20240103003', '2024-01-17', 1, 3, '[{"productId":4,"quantity":30}]', 'balance', 'pending', '调拨员C');
