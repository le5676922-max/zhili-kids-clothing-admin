/**
 * supply-chain-data.js - 供应链数据层
 * 包含所有硬编码的模拟数据（订单、库存、供需、新闻等）
 * 由 supply-chain.js 提取而来
 */

/* ===================== 订单模拟数据 ===================== */
const OrderMockData = [
  {id:'ORD-20230701-001', customer:'杭州童趣服装店', type:'儿童T恤', amount:'¥12,500', date:'2023-07-01', delivery:'2023-07-20', status:'新订单', statusClass:'new', detail:'纯棉T恤，夏季新款，尺码齐全。'},
  {id:'ORD-20230630-089', customer:'湖州小天使童装', type:'婴儿连体衣', amount:'¥8,200', date:'2023-06-30', delivery:'2023-07-15', status:'生产中', statusClass:'inprocess', detail:'有机棉连体衣，适合0-2岁婴儿。'},
  {id:'ORD-20230629-045', customer:'上海童心服饰', type:'儿童外套', amount:'¥23,800', date:'2023-06-29', delivery:'2023-07-25', status:'生产中', statusClass:'inprocess', detail:'秋冬新款外套，防风保暖。'},
  {id:'ORD-20230628-102', customer:'南京萌宝坊', type:'儿童裤装', amount:'¥9,600', date:'2023-06-28', delivery:'2023-07-10', status:'待发货', statusClass:'shipping', detail:'弹力棉裤，适合户外活动。'},
  {id:'ORD-20230627-056', customer:'苏州童乐汇', type:'儿童套装', amount:'¥18,400', date:'2023-06-27', delivery:'2023-07-12', status:'异常', statusClass:'exception', detail:'订单异常，等待客户确认。'},
  {id:'ORD-20230625-021', customer:'嘉兴贝贝童装', type:'儿童连衣裙', amount:'¥15,600', date:'2023-06-25', delivery:'2023-07-18', status:'新订单', statusClass:'new', detail:'夏季连衣裙，花色多样。'},
  {id:'ORD-20230624-078', customer:'无锡童趣园', type:'儿童牛仔裤', amount:'¥10,900', date:'2023-06-24', delivery:'2023-07-16', status:'待发货', statusClass:'shipping', detail:'耐磨牛仔裤，适合日常穿着。'},
  {id:'ORD-20230623-034', customer:'常州小精灵', type:'儿童卫衣', amount:'¥13,200', date:'2023-06-23', delivery:'2023-07-14', status:'已完成', statusClass:'completed', detail:'秋季卫衣，柔软舒适。'},
  {id:'ORD-20230622-055', customer:'南通童梦坊', type:'儿童马甲', amount:'¥7,800', date:'2023-06-22', delivery:'2023-07-13', status:'已完成', statusClass:'completed', detail:'轻薄马甲，适合春秋季。'},
  {id:'ORD-20230621-099', customer:'镇江童乐园', type:'儿童衬衫', amount:'¥11,300', date:'2023-06-21', delivery:'2023-07-11', status:'新订单', statusClass:'new', detail:'纯棉衬衫，透气吸汗。'},
  {id:'ORD-20230620-066', customer:'扬州童趣服饰', type:'儿童短裤', amount:'¥9,700', date:'2023-06-20', delivery:'2023-07-09', status:'生产中', statusClass:'inprocess', detail:'夏季短裤，轻薄凉爽。'},
];

/* ===================== 订单列表别名（兼容原代码） ===================== */
const allOrders = OrderMockData;

/* ===================== 库存模拟数据 ===================== */
const InventoryDB = {
    products: [
        { id: 'P001', name: '有机棉针织面料', spec: '32支', category: '原材料', unit: '米', price: 25.50, stock: 150, warehouse: 'warehouse2', supplier: 'supplier1' },
        { id: 'P002', name: '童装印花面料', spec: '40支', category: '原材料', unit: '米', price: 32.80, stock: 89, warehouse: 'warehouse1', supplier: 'supplier2' },
        { id: 'P003', name: '纽扣配件', spec: '12mm', category: '辅料', unit: '个', price: 0.50, stock: 500, warehouse: 'warehouse1', supplier: 'supplier3' },
        { id: 'P004', name: '拉链配件', spec: '20cm', category: '辅料', unit: '条', price: 2.30, stock: 280, warehouse: 'warehouse1', supplier: 'supplier3' },
        { id: 'P005', name: '童装T恤', spec: '110-160码', category: '成品', unit: '件', price: 45.00, stock: 120, warehouse: 'warehouse3', supplier: null },
        { id: 'P006', name: '童装连衣裙', spec: '110-150码', category: '成品', unit: '件', price: 68.00, stock: 85, warehouse: 'warehouse3', supplier: null },
        { id: 'P007', name: '弹力牛仔面料', spec: '12oz', category: '原材料', unit: '米', price: 28.90, stock: 200, warehouse: 'warehouse2', supplier: 'supplier1' },
        { id: 'P008', name: '童装外套', spec: '120-170码', category: '成品', unit: '件', price: 89.00, stock: 65, warehouse: 'warehouse3', supplier: null },
        { id: 'P009', name: '绣花线', spec: '多色', category: '辅料', unit: '卷', price: 3.20, stock: 350, warehouse: 'warehouse1', supplier: 'supplier3' },
        { id: 'P010', name: '童装短裤', spec: '110-160码', category: '成品', unit: '件', price: 35.00, stock: 95, warehouse: 'warehouse3', supplier: null },
        { id: 'P011', name: '纯棉里布', spec: '平纹', category: '原材料', unit: '米', price: 18.50, stock: 180, warehouse: 'warehouse2', supplier: 'supplier1' },
        { id: 'P012', name: '魔术贴', spec: '2cm宽', category: '辅料', unit: '米', price: 1.80, stock: 120, warehouse: 'warehouse1', supplier: 'supplier3' }
    ],
    suppliers: [
        { id: 'supplier1', name: '织里优质面料有限公司', contact: '张经理', phone: '0572-3856789', address: '湖州市织里镇工业园区A区' },
        { id: 'supplier2', name: '湖州印艺数码科技有限公司', contact: '李总', phone: '0572-3967890', address: '湖州市织里镇数码印花园' },
        { id: 'supplier3', name: '浙江童装辅料供应商', contact: '王主管', phone: '0572-3745612', address: '湖州市织里镇辅料市场B栋' },
        { id: 'supplier4', name: '江苏优质纺织有限公司', contact: '陈经理', phone: '0512-6789012', address: '江苏省苏州市纺织工业园' },
        { id: 'supplier5', name: '广东童装配件厂', contact: '刘总监', phone: '0769-8901234', address: '广东省东莞市童装产业园' }
    ],
    warehouses: [
        { id: 'warehouse1', name: '主仓库', address: '织里镇中心仓储区1号', manager: '赵仓管', capacity: 5000 },
        { id: 'warehouse2', name: '原料仓库', address: '织里镇原料存储区2号', manager: '钱仓管', capacity: 3000 },
        { id: 'warehouse3', name: '成品仓库', address: '织里镇成品存储区3号', manager: '孙仓管', capacity: 4000 }
    ],
    customers: [
        { id: 'dept1', name: '生产部', type: 'department', contact: '生产主管', phone: '内线001' },
        { id: 'dept2', name: '销售部', type: 'department', contact: '销售经理', phone: '内线002' },
        { id: 'dept3', name: '设计部', type: 'department', contact: '设计总监', phone: '内线003' },
        { id: 'customer1', name: '杭州童装批发市场', type: 'customer', contact: '采购部', phone: '0571-8888888' },
        { id: 'customer2', name: '上海儿童服饰连锁店', type: 'customer', contact: '区域经理', phone: '021-9999999' },
        { id: 'customer3', name: '北京童装专卖店', type: 'customer', contact: '店长', phone: '010-7777777' },
        { id: 'customer4', name: '广州童装贸易公司', type: 'customer', contact: '贸易经理', phone: '020-6666666' }
    ],
    inboundRecords: [
        { id: 'RK20240101001', date: '2024-01-15', supplier: 'supplier1', warehouse: 'warehouse2', products: [{ productId: 'P001', quantity: 100, price: 25.50 }], status: 'completed', operator: '张三', totalAmount: 2550 },
        { id: 'RK20240102002', date: '2024-01-16', supplier: 'supplier2', warehouse: 'warehouse1', products: [{ productId: 'P002', quantity: 50, price: 32.80 }], status: 'approved', operator: '李四', totalAmount: 1640 },
        { id: 'RK20240103003', date: '2024-01-17', supplier: 'supplier3', warehouse: 'warehouse1', products: [{ productId: 'P003', quantity: 200, price: 0.50 }], status: 'pending', operator: '王五', totalAmount: 100 },
        { id: 'RK20240104004', date: '2024-01-18', supplier: 'supplier1', warehouse: 'warehouse2', products: [{ productId: 'P007', quantity: 80, price: 28.90 }], status: 'completed', operator: '张三', totalAmount: 2312 },
        { id: 'RK20240105005', date: '2024-01-19', supplier: 'supplier3', warehouse: 'warehouse1', products: [{ productId: 'P004', quantity: 150, price: 2.30 }], status: 'approved', operator: '赵六', totalAmount: 345 },
        { id: 'RK20240106006', date: '2024-01-20', supplier: 'supplier2', warehouse: 'warehouse1', products: [{ productId: 'P009', quantity: 100, price: 3.20 }], status: 'completed', operator: '李四', totalAmount: 320 },
        { id: 'RK20240107007', date: '2024-01-21', supplier: 'supplier1', warehouse: 'warehouse2', products: [{ productId: 'P011', quantity: 120, price: 18.50 }], status: 'pending', operator: '张三', totalAmount: 2220 },
        { id: 'RK20240108008', date: '2024-01-22', supplier: 'supplier2', warehouse: 'warehouse1', products: [{ productId: 'P002', quantity: 75, price: 32.80 }], status: 'approved', operator: '李四', totalAmount: 2460 },
        { id: 'RK20240109009', date: '2024-01-23', supplier: 'supplier3', warehouse: 'warehouse1', products: [{ productId: 'P012', quantity: 80, price: 1.80 }], status: 'completed', operator: '王五', totalAmount: 144 },
        { id: 'RK20240110010', date: '2024-01-24', supplier: 'supplier1', warehouse: 'warehouse2', products: [{ productId: 'P001', quantity: 60, price: 25.50 }], status: 'completed', operator: '张三', totalAmount: 1530 },
        { id: 'RK20240111011', date: '2024-01-25', supplier: 'supplier2', warehouse: 'warehouse1', products: [{ productId: 'P009', quantity: 150, price: 3.20 }], status: 'approved', operator: '李四', totalAmount: 480 },
        { id: 'RK20240112012', date: '2024-01-26', supplier: 'supplier3', warehouse: 'warehouse1', products: [{ productId: 'P003', quantity: 300, price: 0.50 }], status: 'pending', operator: '赵六', totalAmount: 150 },
        { id: 'RK20240113013', date: '2024-01-27', supplier: 'supplier1', warehouse: 'warehouse2', products: [{ productId: 'P007', quantity: 90, price: 28.90 }], status: 'completed', operator: '张三', totalAmount: 2601 },
        { id: 'RK20240114014', date: '2024-01-28', supplier: 'supplier2', warehouse: 'warehouse1', products: [{ productId: 'P002', quantity: 40, price: 32.80 }], status: 'approved', operator: '李四', totalAmount: 1312 },
        { id: 'RK20240115015', date: '2024-01-29', supplier: 'supplier3', warehouse: 'warehouse1', products: [{ productId: 'P004', quantity: 200, price: 2.30 }], status: 'completed', operator: '王五', totalAmount: 460 }
    ],
    outboundRecords: [
        { id: 'CK20240101001', date: '2024-01-15', type: 'sale', warehouse: 'warehouse3', customer: 'customer1', products: [{ productId: 'P005', quantity: 20 }], status: 'completed', operator: '销售员A' },
        { id: 'CK20240102002', date: '2024-01-16', type: 'production', warehouse: 'warehouse2', customer: 'dept1', products: [{ productId: 'P001', quantity: 30 }], status: 'completed', operator: '生产员B' },
        { id: 'CK20240103003', date: '2024-01-17', type: 'sale', warehouse: 'warehouse3', customer: 'customer2', products: [{ productId: 'P006', quantity: 15 }], status: 'processing', operator: '销售员C' },
        { id: 'CK20240104004', date: '2024-01-18', type: 'production', warehouse: 'warehouse1', customer: 'dept1', products: [{ productId: 'P003', quantity: 50 }], status: 'completed', operator: '生产员D' },
        { id: 'CK20240105005', date: '2024-01-19', type: 'sale', warehouse: 'warehouse3', customer: 'customer3', products: [{ productId: 'P008', quantity: 10 }], status: 'completed', operator: '销售员E' },
        { id: 'CK20240106006', date: '2024-01-20', type: 'transfer', warehouse: 'warehouse1', customer: 'warehouse3', products: [{ productId: 'P004', quantity: 25 }], status: 'approved', operator: '仓管员F' },
        { id: 'CK20240107007', date: '2024-01-21', type: 'sale', warehouse: 'warehouse3', customer: 'customer1', products: [{ productId: 'P010', quantity: 25 }], status: 'completed', operator: '销售员A' },
        { id: 'CK20240108008', date: '2024-01-22', type: 'production', warehouse: 'warehouse2', customer: 'dept1', products: [{ productId: 'P007', quantity: 40 }], status: 'approved', operator: '生产员B' },
        { id: 'CK20240109009', date: '2024-01-23', type: 'sale', warehouse: 'warehouse3', customer: 'customer4', products: [{ productId: 'P005', quantity: 18 }], status: 'pending', operator: '销售员C' },
        { id: 'CK20240110010', date: '2024-01-24', type: 'production', warehouse: 'warehouse1', customer: 'dept1', products: [{ productId: 'P009', quantity: 60 }], status: 'completed', operator: '生产员D' },
        { id: 'CK20240111011', date: '2024-01-25', type: 'sale', warehouse: 'warehouse3', customer: 'customer2', products: [{ productId: 'P006', quantity: 12 }], status: 'processing', operator: '销售员E' },
        { id: 'CK20240112012', date: '2024-01-26', type: 'transfer', warehouse: 'warehouse2', customer: 'warehouse1', products: [{ productId: 'P011', quantity: 35 }], status: 'approved', operator: '仓管员F' },
        { id: 'CK20240113013', date: '2024-01-27', type: 'sale', warehouse: 'warehouse3', customer: 'customer3', products: [{ productId: 'P008', quantity: 8 }], status: 'completed', operator: '销售员A' },
        { id: 'CK20240114014', date: '2024-01-28', type: 'production', warehouse: 'warehouse1', customer: 'dept2', products: [{ productId: 'P012', quantity: 45 }], status: 'approved', operator: '生产员B' },
        { id: 'CK20240115015', date: '2024-01-29', type: 'sale', warehouse: 'warehouse3', customer: 'customer1', products: [{ productId: 'P010', quantity: 22 }], status: 'completed', operator: '销售员C' }
    ],
    transferRecords: [
        { id: 'DB20240101001', date: '2024-01-15', fromWarehouse: 'warehouse1', toWarehouse: 'warehouse2', products: [{ productId: 'P003', quantity: 50 }], reason: 'balance', status: 'completed', operator: '调拨员A' },
        { id: 'DB20240102002', date: '2024-01-16', fromWarehouse: 'warehouse2', toWarehouse: 'warehouse3', products: [{ productId: 'P001', quantity: 20 }], reason: 'shortage', status: 'approved', operator: '调拨员B' },
        { id: 'DB20240103003', date: '2024-01-17', fromWarehouse: 'warehouse1', toWarehouse: 'warehouse3', products: [{ productId: 'P004', quantity: 30 }], reason: 'balance', status: 'pending', operator: '调拨员C' },
        { id: 'DB20240104004', date: '2024-01-18', fromWarehouse: 'warehouse3', toWarehouse: 'warehouse1', products: [{ productId: 'P005', quantity: 15 }], reason: 'maintenance', status: 'completed', operator: '调拨员D' },
        { id: 'DB20240105005', date: '2024-01-19', fromWarehouse: 'warehouse2', toWarehouse: 'warehouse1', products: [{ productId: 'P007', quantity: 25 }], reason: 'shortage', status: 'approved', operator: '调拨员A' },
        { id: 'DB20240106006', date: '2024-01-20', fromWarehouse: 'warehouse1', toWarehouse: 'warehouse3', products: [{ productId: 'P009', quantity: 40 }], reason: 'balance', status: 'completed', operator: '调拨员B' },
        { id: 'DB20240107007', date: '2024-01-21', fromWarehouse: 'warehouse3', toWarehouse: 'warehouse2', products: [{ productId: 'P006', quantity: 12 }], reason: 'maintenance', status: 'pending', operator: '调拨员C' },
        { id: 'DB20240108008', date: '2024-01-22', fromWarehouse: 'warehouse2', toWarehouse: 'warehouse3', products: [{ productId: 'P011', quantity: 35 }], reason: 'shortage', status: 'approved', operator: '调拨员D' },
        { id: 'DB20240109009', date: '2024-01-23', fromWarehouse: 'warehouse1', toWarehouse: 'warehouse2', products: [{ productId: 'P012', quantity: 28 }], reason: 'balance', status: 'completed', operator: '调拨员A' },
        { id: 'DB20240110010', date: '2024-01-24', fromWarehouse: 'warehouse3', toWarehouse: 'warehouse1', products: [{ productId: 'P008', quantity: 18 }], reason: 'other', status: 'approved', operator: '调拨员B' },
        { id: 'DB20240111011', date: '2024-01-25', fromWarehouse: 'warehouse2', toWarehouse: 'warehouse3', products: [{ productId: 'P002', quantity: 22 }], reason: 'shortage', status: 'pending', operator: '调拨员C' },
        { id: 'DB20240112012', date: '2024-01-26', fromWarehouse: 'warehouse1', toWarehouse: 'warehouse2', products: [{ productId: 'P010', quantity: 16 }], reason: 'balance', status: 'completed', operator: '调拨员D' }
    ]
};

/* ===================== 供需信息模拟数据 ===================== */
const SupplyDemandDB = {
    demands: [
        {
            id: 'DM20240101001',
            title: '高品质全棉针织面料采购需求',
            type: 'material',
            category: '原材料需求',
            urgency: 'high',
            status: 'open',
            company: '浙江童趣服饰有限公司',
            contact: '张经理',
            phone: '0571-8888888',
            email: 'zhang@tongqu.com',
            description: '采购40支全棉针织面料，用于2023秋冬款童装生产，颜色要求：白色、浅蓝、粉红，规格：175cm宽，每色各需5000米。',
            specifications: { material: '全棉', count: '40支', width: '175cm', colors: ['白色','浅蓝','粉红'], quantity: '15000米', usage: '童装生产' },
            budget: '150000-200000',
            deadline: '2024-02-15',
            publishDate: '2024-01-10',
            tags: ['全棉','针织面料','40支'],
            location: '浙江省湖州市',
            requirements: ['面料质量符合国家童装标准','色牢度达到4级以上','甲醛含量低于20mg/kg','支持小批量试样','交货期不超过15天'],
            attachments: [{ name: '面料规格书.pdf', size: '2.3MB' },{ name: '色卡参考.jpg', size: '1.8MB' }]
        },
        {
            id: 'DM20240102002',
            title: '童装印花加工服务需求',
            type: 'processing',
            category: '加工服务',
            urgency: 'medium',
            status: 'inprocess',
            company: '湖州小森林童装设计工作室',
            contact: '李设计师',
            phone: '0572-3333333',
            email: 'li@xiaoshenlin.com',
            description: '寻找童装数码印花加工厂，可承接小批量定制印花，要求环保无毒，色牢度高，交货周期短。',
            specifications: { printType: '数码印花', fabric: '纯棉、棉混纺', colors: '多色印花', quantity: '500-2000件/批', size: '80-160码' },
            budget: '8-15元/件',
            deadline: '2024-03-01',
            publishDate: '2024-01-12',
            tags: ['数码印花','环保','小批量'],
            location: '浙江省湖州市',
            requirements: ['使用环保水性墨水','色牢度达到3-4级','支持个性化定制','交货周期7-10天','提供打样服务'],
            attachments: [{ name: '印花设计稿.ai', size: '5.2MB' },{ name: '工艺要求.docx', size: '0.8MB' }]
        },
        {
            id: 'DM20240103003',
            title: '2024春夏童装设计服务需求',
            type: 'design',
            category: '设计服务',
            urgency: 'low',
            status: 'open',
            company: '快乐童年服饰有限公司',
            contact: '王总',
            phone: '0572-5555555',
            email: 'wang@happykids.com',
            description: '寻找专业童装设计师，为2024春夏季设计10款0-3岁婴幼儿服装，主题为"自然探索"，设计风格简约自然。',
            specifications: { ageGroup: '0-3岁', season: '春夏', style: '简约自然', theme: '自然探索', quantity: '10款', gender: '男女童通用' },
            budget: '5000-8000元/款',
            deadline: '2024-04-30',
            publishDate: '2024-01-15',
            tags: ['婴幼儿','春夏','设计服务'],
            location: '浙江省湖州市',
            requirements: ['具有3年以上童装设计经验','熟悉婴幼儿服装安全标准','提供完整设计方案','包含款式图、工艺单','支持后续打样指导'],
            attachments: [{ name: '品牌调性说明.pdf', size: '3.1MB' },{ name: '参考图片.zip', size: '12.5MB' }]
        },
        {
            id: 'DM20240104004',
            title: '童装纽扣配件批量采购',
            type: 'accessory',
            category: '辅料配件',
            urgency: 'high',
            status: 'open',
            company: '织里童装制造有限公司',
            contact: '陈采购',
            phone: '0572-7777777',
            email: 'chen@zhili-kids.com',
            description: '需要采购各种规格的童装纽扣，包括塑料扣、金属扣、木质扣等，用于春夏童装生产。',
            specifications: { materials: ['塑料','金属','木质'], sizes: ['10mm','12mm','15mm','18mm'], colors: '多色可选', quantity: '100000个', packaging: '按规格分装' },
            budget: '0.1-0.5元/个',
            deadline: '2024-02-20',
            publishDate: '2024-01-08',
            tags: ['纽扣','配件','批量采购'],
            location: '浙江省湖州市',
            requirements: ['符合童装安全标准','无尖锐边角','色牢度稳定','支持定制LOGO','包装完整无损'],
            attachments: [{ name: '纽扣规格表.xlsx', size: '1.2MB' }]
        }
    ],
    supplies: [
        {
            id: 'SP20240101001',
            title: '有机棉面料供应',
            type: 'material',
            category: '原材料',
            urgency: 'medium',
            status: 'available',
            company: '织里优质面料有限公司',
            contact: '张经理',
            phone: '0572-3856789',
            email: 'sales@zhili-textile.com',
            description: '长期供应有机棉面料，GOTS认证，品质优良，价格合理，支持小批量定制。',
            specifications: { material: '有机棉', certification: 'GOTS认证', width: '145-185cm', weight: '120-200g/m²' },
            price: '28-45元/米',
            publishDate: '2024-01-05',
            tags: ['有机棉','GOTS认证','面料'],
            location: '浙江省湖州市织里镇',
            requirements: ['支持来样定做','可提供检测报告','最低起订量100米'],
            attachments: [{ name: '有机棉面料样本.jpg', size: '3.5MB' }]
        },
        {
            id: 'SP20240102002',
            title: '童装数码印花加工服务',
            type: 'processing',
            category: '加工服务',
            urgency: 'low',
            status: 'available',
            company: '湖州印艺数码科技有限公司',
            contact: '李总',
            phone: '0572-3967890',
            email: 'info@yz-digitech.com',
            description: '专业童装数码印花加工，环保墨水，色彩鲜艳，色牢度高，支持小批量定制，最小起订量50件。',
            specifications: { service: '数码印花', ink: '环保水性墨水', minQty: '50件/款', capacity: '5000件/天' },
            price: '6-12元/件',
            publishDate: '2024-01-07',
            tags: ['数码印花','环保','小批量'],
            location: '浙江省湖州市织里镇',
            requirements: ['支持来图定制','提供免费打样','7天交货'],
            attachments: [{ name: '数码印花案例集.pdf', size: '8.2MB' }]
        }
    ]
};

/* ===================== 新闻数据 ===================== */
const NewsData = [
    {
        id: 1,
        title: '织里镇童装产业数字化转型推进会顺利召开',
        date: '2024-01-15',
        category: '行业动态',
        image: '../images/products/special/special-costume-01.jpg',
        content: '<p>织里镇人民政府组织召开童装产业数字化转型推进会，会议强调要加快推进童装产业数字化转型，提升产业竞争力...</p>'
    },
    {
        id: 2,
        title: '织里镇举办首届童装设计大赛',
        date: '2024-01-12',
        category: '行业动态',
        image: '../images/products/seasonal/seasonal-sweater-01.jpg',
        content: '<p>为推动织里童装创新设计能力提升，培养更多优秀童装设计人才，织里镇举办首届童装设计大赛...</p>'
    }
];
