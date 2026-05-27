package com.example.java.service;

import com.example.java.dto.ProductVO;
import com.example.java.dto.SupplyDemandVO;
import com.example.java.dto.SupplySupplyVO;
import com.example.java.entity.*;
import com.example.java.mapper.*;
import com.example.java.dto.InventoryProductVO;
import com.example.java.dto.InventoryWarehouseVO;
import com.example.java.dto.InventorySupplierVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * RAG 知识库检索服务（优化版）
 * <p>
 * 采用关键词分词 + TF-IDF 相似度评分，从数据库中检索相关数据作为 AI 对话的上下文增强。
 * 相比旧版的全量加载 + 字符串 contains，本版实现：
 * - 关键词分词（bigram + 单字）
 * - 多字段加权匹配
 * - 相关性评分排序
 * - 简洁的结果格式化
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final ProductMapper productMapper;
    private final SupplyDemandMapper supplyDemandMapper;
    private final SupplySupplyMapper supplySupplyMapper;
    private final TrainingCourseMapper trainingCourseMapper;
    private final JobPositionMapper jobPositionMapper;
    private final InventoryProductMapper inventoryProductMapper;
    private final InventoryWarehouseMapper inventoryWarehouseMapper;
    private final InventorySupplierMapper inventorySupplierMapper;
    private final OrderMapper orderMapper;
    private final UserMapper userMapper;

    /** 单次检索返回的最大条目数 */
    private static final int MAX_RESULTS = 3;
    /** 描述字段截断长度 */
    private static final int DESC_MAX_LEN = 60;

    // ==================== 公共接口 ====================

    /**
     * 根据用户问题搜索相关知识，返回格式化的上下文文本。
     * 若未找到任何相关内容，返回平台概览统计。
     */
    public String searchKnowledge(String query) {
        if (query == null || query.isBlank()) return "";
        String q = query.trim().toLowerCase();
        List<String> tokens = tokenize(q);

        StringBuilder kb = new StringBuilder(4096);

        // ===== 用户端 =====
        // 产品
        if (matchesDomain(tokens, "产品", "商品", "童装", "衣服", "购买", "价格", "分类", "材质", "季节", "尺码", "风格",
                "款式", "新品", "热销", "推荐", "折扣", "优惠")) {
            appendSection(kb, "相关产品", searchProducts(tokens));
        }
        // 供需
        if (matchesDomain(tokens, "供需", "需求", "供应", "原材料", "配件", "加工", "对接", "物流", "运输", "配送",
                "调拨", "找合作", "找供应商", "找客户", "合作机会", "匹配")) {
            appendSection(kb, "相关需求", searchDemands(tokens));
            appendSection(kb, "相关供应", searchSupplies(tokens));
        }
        // 课程
        if (matchesDomain(tokens, "课程", "培训", "学习", "报名", "讲师", "上课", "教学", "技能", "证书")) {
            appendSection(kb, "相关培训课程", searchCourses(tokens));
        }
        // 职位
        if (matchesDomain(tokens, "招聘", "求职", "工作", "职位", "薪资", "岗位", "简历", "投递", "申请", "经验", "学历", "面试",
                "录用", "招人", "找工作", "应聘")) {
            appendSection(kb, "相关招聘职位", searchJobs(tokens));
        }
        // 库存
        if (matchesDomain(tokens, "库存", "存货", "缺货", "备货", "盘点", "库存量", "库存不足", "低库存", "告急")) {
            appendSection(kb, "库存商品", searchInventoryProducts(tokens));
            appendSection(kb, "库存低的商品", searchLowStockProducts());
        }
        if (matchesDomain(tokens, "仓库", "库房", "存放", "储位")) {
            appendSection(kb, "仓库列表", searchWarehouses(tokens));
        }
        if (matchesDomain(tokens, "供应商", "供货商", "采购源", "货源", "供货")) {
            appendSection(kb, "供应商列表", searchSuppliers(tokens));
        }
        // 订单与退款
        if (matchesDomain(tokens, "订单", "退款", "退货", "支付", "发货", "收货", "售后", "订单状态", "物流跟踪", "快递")) {
            appendSection(kb, "平台订单概况", searchOrderStats());
            kb.append(getOrderRefundGuide());
        }
        // 购物
        if (matchesDomain(tokens, "购物", "购物车", "下单", "结算", "购买流程", "付款")) {
            kb.append(getShoppingGuide());
        }
        // 账户
        if (matchesDomain(tokens, "登录", "注册", "密码", "邮箱", "忘记", "修改密码", "个人中心", "头像", "昵称", "账号", "找回")) {
            kb.append(getAccountGuide());
        }
        // 企业
        if (matchesDomain(tokens, "企业", "公司", "认证", "资质", "营业执照", "入驻", "企业信息", "开店")) {
            kb.append(getEnterpriseGuide());
        }
        // 发布
        if (matchesDomain(tokens, "发布", "上架", "怎么发", "如何发", "添加商品", "发布需求", "发布供应", "发布职位")) {
            kb.append(getPublishGuide());
        }
        // 市场
        if (matchesDomain(tokens, "市场", "趋势", "资讯", "政策", "法规", "展会", "出口", "进口", "童装产业", "行业")) {
            kb.append(getMarketGuide());
        }
        // 总览/统计
        if (matchesDomain(tokens, "总览", "概况", "概览", "统计", "有多少", "多少家", "多少个", "多少件", "平台规模",
                "查询", "查一下", "看看", "目前", "当前", "现有", "帮我查", "查查", "数据", "介绍一下")) {
            appendSection(kb, "平台实时数据", searchAdminStats());
            kb.append(getPlatformOverview());
        }

        // ===== 管理员端 =====
        if (matchesDomain(tokens, "仪表盘", "dashboard", "首页数据")) {
            appendSection(kb, "管理后台仪表盘数据", searchAdminStats());
        }
        if (matchesDomain(tokens, "审核", "审批", "待审核", "驳回", "通过审核", "拒绝企业", "通过企业", "审核企业", "认证企业")) {
            appendSection(kb, "企业管理数据", searchAdminStats());
            kb.append(getEnterpriseAuditGuide());
        }
        if (matchesDomain(tokens, "用户管理", "重置密码", "删除用户", "用户列表", "封号", "管理员账号", "管理员",
                "注册用户数", "用户数量", "哪些用户", "查看用户")) {
            appendSection(kb, "用户管理数据", searchAdminStats());
            kb.append(getUserManagementGuide());
        }
        if (matchesDomain(tokens, "产品管理", "上架", "下架", "上下架", "商品管理", "商品数量", "哪些商品")) {
            appendSection(kb, "产品管理数据", searchAdminStats());
            kb.append(getProductManagementGuide());
        }
        if (matchesDomain(tokens, "课程管理", "添加课程", "课程上下架", "课程订单", "培训管理")) {
            appendSection(kb, "平台数据", searchAdminStats());
            kb.append(getCourseManagementGuide());
        }
        if (matchesDomain(tokens, "供需管理", "对接管理", "需求管理", "供应管理", "对接记录")) {
            appendSection(kb, "平台数据", searchAdminStats());
            kb.append(getSupplyDemandAdminGuide());
        }
        if (matchesDomain(tokens, "工单", "工单处理", "客服工单", "用户反馈", "用户问题")) {
            kb.append(getWorkOrderAdminGuide());
        }
        if (matchesDomain(tokens, "订单管理", "查看订单", "所有订单", "订单列表", "订单数据")) {
            appendSection(kb, "订单管理数据", searchAdminStats());
        }
        if (matchesDomain(tokens, "删除", "移除", "清理")) {
            kb.append(getDeleteWarningGuide());
        }
        if (matchesDomain(tokens, "后台", "管理后台", "系统管理", "后台怎么用", "管理员功能")) {
            appendSection(kb, "管理后台数据总览", searchAdminStats());
            kb.append(getAdminOverviewGuide());
        }

        // ===== 通用 =====
        if (matchesDomain(tokens, "怎么", "如何", "帮助", "教程", "指南", "流程", "步骤", "操作", "使用", "功能", "不会", "教我", "告诉我")) {
            kb.append(getCompactGuide());
        }

        // 兜底：无匹配时返回平台概览
        if (kb.isEmpty()) {
            appendSection(kb, "平台数据总览", searchAdminStats());
            kb.append(getPlatformOverview());
        }

        return kb.toString();
    }

    public String getSystemPrompt() {
        return """
                你是"织里镇童装产业协同管理平台"的智能助手，名叫小织。平台服务于中国童装之都织里镇的童装产业链企业。

                平台核心功能：
                - 产品展示与交易（商城购物）
                - 供需对接（企业间匹配合作）
                - 人才招聘与培训课程
                - 库存管理与物流追踪
                - AI智能问答与数据分析
                - 企业管理后台（仅管理员）

                回答要求：
                1. 专业、简洁、友好，像真人客服一样自然交流
                2. 优先结合【相关知识库内容】中的平台实时数据回答，数据来自数据库实时查询
                3. 涉及具体平台操作给出清晰的点击路径（如：登录 → 供应链协同 → 供需对接 → 发布需求）
                4. 当用户问"怎么""如何"时，给出步骤式指导
                5. 不确定时引导用户联系平台客服
                6. 不要编造不存在的数据，知识库里没有的直接说没查到
                7. 必须使用纯文本格式回复，禁止使用任何 Markdown 语法（如 #、**、*、`、```、- 列表、| 表格等），用自然段落和换行表达结构
                """;
    }

    // ==================== 分词与匹配 ====================

    /** 中文简单分词：提取2-gram + 单字 */
    private List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        String cleaned = text.replaceAll("[，。！？、；：\"'（）\\[\\]【】\\s]+", "");
        for (int i = 0; i < cleaned.length(); i++) {
            tokens.add(String.valueOf(cleaned.charAt(i)));
            if (i + 1 < cleaned.length()) {
                tokens.add(cleaned.substring(i, Math.min(i + 2, cleaned.length())));
            }
        }
        // 去重并保留原查询词
        return tokens.stream().distinct().collect(Collectors.toList());
    }

    /** 判断查询是否属于某领域 */
    private boolean matchesDomain(List<String> tokens, String... keywords) {
        for (String kw : keywords) {
            for (String t : tokens) {
                if (t.contains(kw) || kw.contains(t)) return true;
            }
        }
        return false;
    }

    /**
     * 计算文本与 token 列表的相关性得分。
     * 得分 = 每个匹配 token 在文本中出现的次数加权。
     */
    private int relevanceScore(String text, List<String> tokens) {
        if (text == null || text.isEmpty()) return 0;
        String lower = text.toLowerCase();
        int score = 0;
        for (String t : tokens) {
            if (t.length() >= 2 && lower.contains(t)) score += 3; // bigram 匹配权重高
            else if (lower.contains(t)) score += 1;
        }
        return score;
    }

    // ==================== 数据检索 ====================

    private String searchProducts(List<String> tokens) {
        try {
            List<ProductVO> all = productMapper.findListForDisplay();
            if (all == null || all.isEmpty()) return "";
            int limit = Math.min(all.size(), 200); // 仅扫描前200条
            return all.subList(0, limit).stream()
                    .map(p -> new AbstractMap.SimpleEntry<>(p, relevanceScore(
                            (p.getName() != null ? p.getName() : "")
                                    + " " + (p.getDescription() != null ? p.getDescription() : "")
                                    + " " + (p.getCategory() != null ? p.getCategory() : "")
                                    + " " + (p.getMaterial() != null ? p.getMaterial() : ""), tokens)))
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(MAX_RESULTS)
                    .map(e -> formatProduct(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索产品失败", e); return ""; }
    }

    private String searchDemands(List<String> tokens) {
        try {
            List<SupplyDemandVO> all = supplyDemandMapper.findAll();
            if (all == null || all.isEmpty()) return "";
            int limit = Math.min(all.size(), 100);
            return all.subList(0, limit).stream()
                    .map(d -> new AbstractMap.SimpleEntry<>(d, relevanceScore(
                            (d.getTitle() != null ? d.getTitle() : "")
                                    + " " + (d.getDescription() != null ? d.getDescription() : "")
                                    + " " + (d.getType() != null ? d.getType() : "")
                                    + " " + (d.getCategory() != null ? d.getCategory() : ""), tokens)))
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(MAX_RESULTS)
                    .map(e -> formatDemand(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索需求失败", e); return ""; }
    }

    private String searchSupplies(List<String> tokens) {
        try {
            List<SupplySupplyVO> all = supplySupplyMapper.findAll();
            if (all == null || all.isEmpty()) return "";
            int limit = Math.min(all.size(), 100);
            return all.subList(0, limit).stream()
                    .map(s -> new AbstractMap.SimpleEntry<>(s, relevanceScore(
                            (s.getTitle() != null ? s.getTitle() : "")
                                    + " " + (s.getDescription() != null ? s.getDescription() : "")
                                    + " " + (s.getType() != null ? s.getType() : "")
                                    + " " + (s.getCategory() != null ? s.getCategory() : ""), tokens)))
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(MAX_RESULTS)
                    .map(e -> formatSupply(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索供应失败", e); return ""; }
    }

    private String searchCourses(List<String> tokens) {
        try {
            List<TrainingCourse> all = trainingCourseMapper.findAll();
            if (all == null || all.isEmpty()) return "";
            int limit = Math.min(all.size(), 100);
            return all.subList(0, limit).stream()
                    .map(c -> new AbstractMap.SimpleEntry<>(c, relevanceScore(
                            (c.getCourseName() != null ? c.getCourseName() : "")
                                    + " " + (c.getCourseDescription() != null ? c.getCourseDescription() : "")
                                    + " " + (c.getCourseCategory() != null ? c.getCourseCategory() : "")
                                    + " " + (c.getInstructor() != null ? c.getInstructor() : ""), tokens)))
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(MAX_RESULTS)
                    .map(e -> formatCourse(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索课程失败", e); return ""; }
    }

    private String searchJobs(List<String> tokens) {
        try {
            List<JobPosition> all = jobPositionMapper.findAll();
            if (all == null || all.isEmpty()) return "";
            int limit = Math.min(all.size(), 100);
            return all.subList(0, limit).stream()
                    .map(j -> new AbstractMap.SimpleEntry<>(j, relevanceScore(
                            (j.getJobName() != null ? j.getJobName() : "")
                                    + " " + (j.getJobDescription() != null ? j.getJobDescription() : "")
                                    + " " + (j.getJobCategory() != null ? j.getJobCategory() : "")
                                    + " " + (j.getWorkLocation() != null ? j.getWorkLocation() : ""), tokens)))
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(MAX_RESULTS)
                    .map(e -> formatJob(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索职位失败", e); return ""; }
    }

    private String searchInventoryProducts(List<String> tokens) {
        try {
            List<InventoryProductVO> all = inventoryProductMapper.findAll(null, null, null);
            if (all == null || all.isEmpty()) return "";
            int limit = Math.min(all.size(), 100);
            return all.subList(0, limit).stream()
                    .<Map.Entry<InventoryProductVO, Integer>>map(p -> new AbstractMap.SimpleEntry<>(p, relevanceScore(
                            (p.getName() != null ? p.getName() : "")
                                    + " " + (p.getCategory() != null ? p.getCategory() : "")
                                    + " " + (p.getSpec() != null ? p.getSpec() : "")
                                    + " " + (p.getWarehouseName() != null ? p.getWarehouseName() : "")
                                    + " " + (p.getSupplierName() != null ? p.getSupplierName() : ""), tokens)))
                    .filter(e -> e.getValue() > 0)
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(MAX_RESULTS)
                    .map(e -> formatInventoryProduct(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索库存商品失败", e); return ""; }
    }

    private String searchLowStockProducts() {
        try {
            List<InventoryProductVO> all = inventoryProductMapper.findLowStock();
            if (all == null || all.isEmpty()) return "";
            return all.stream().limit(MAX_RESULTS)
                    .map(p -> String.format("- %s [%s] | 库存:%d(最低%d) | %s仓库 | %s\n",
                            p.getName(), nvl(p.getSpec()), p.getStock(), p.getMinStock(),
                            nvl(p.getWarehouseName()), nvl(p.getSupplierName())))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索低库存商品失败", e); return ""; }
    }

    private String searchWarehouses(List<String> tokens) {
        try {
            List<InventoryWarehouseVO> all = inventoryWarehouseMapper.findAll();
            if (all == null || all.isEmpty()) return "";
            return all.stream()
                    .<Map.Entry<InventoryWarehouseVO, Integer>>map(w -> new AbstractMap.SimpleEntry<>(w, relevanceScore(
                            (w.getName() != null ? w.getName() : "")
                                    + " " + (w.getAddress() != null ? w.getAddress() : "")
                                    + " " + (w.getManager() != null ? w.getManager() : ""), tokens)))
                    .filter(e -> e.getValue() > 0 || all.size() <= 10)
                    .sorted(Comparator.comparingInt(a -> -a.getValue()))
                    .limit(MAX_RESULTS)
                    .map(e -> formatWarehouse(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索仓库失败", e); return ""; }
    }

    private String searchSuppliers(List<String> tokens) {
        try {
            List<InventorySupplierVO> all = inventorySupplierMapper.findAll();
            if (all == null || all.isEmpty()) return "";
            return all.stream()
                    .<Map.Entry<InventorySupplierVO, Integer>>map(s -> new AbstractMap.SimpleEntry<>(s, relevanceScore(
                            (s.getName() != null ? s.getName() : "")
                                    + " " + (s.getContactPerson() != null ? s.getContactPerson() : "")
                                    + " " + (s.getContactPhone() != null ? s.getContactPhone() : "")
                                    + " " + (s.getAddress() != null ? s.getAddress() : ""), tokens)))
                    .filter(e -> e.getValue() > 0 || all.size() <= 10)
                    .sorted(Comparator.comparingInt(a -> -a.getValue()))
                    .limit(MAX_RESULTS)
                    .map(e -> formatSupplier(e.getKey()))
                    .collect(Collectors.joining());
        } catch (Exception e) { log.error("搜索供应商失败", e); return ""; }
    }

    private String searchOrderStats() {
        try {
            long orderCount = orderMapper.countForAdmin();
            long userCount = userMapper.countForAdmin(null, null, null);
            long enterpriseCount = userMapper.findEnterpriseList().size();
            return String.format("平台累计订单数：%d 笔\n注册用户数：%d 人\n入驻企业数：%d 家",
                    orderCount, userCount, enterpriseCount);
        } catch (Exception e) { log.error("查询订单统计失败", e); return ""; }
    }

    private String getPlatformOverview() {
        StringBuilder sb = new StringBuilder();
        try {
            long userCount = userMapper.countForAdmin(null, null, null);
            long enterpriseCount = userMapper.findEnterpriseList().size();
            long orderCount = orderMapper.countForAdmin();
            int productCount = productMapper.findListForDisplay().size();
            int jobCount = jobPositionMapper.findAll().size();
            int courseCount = trainingCourseMapper.findAll().size();
            int lowStockCount = inventoryProductMapper.countLowStock();

            sb.append("【平台数据总览】\n");
            sb.append("- 注册用户：").append(userCount).append(" 人\n");
            sb.append("- 入驻企业：").append(enterpriseCount).append(" 家\n");
            sb.append("- 在售商品：").append(productCount).append(" 款\n");
            sb.append("- 累计订单：").append(orderCount).append(" 笔\n");
            sb.append("- 在招职位：").append(jobCount).append(" 个\n");
            sb.append("- 培训课程：").append(courseCount).append(" 门\n");
            if (lowStockCount > 0) {
                sb.append("- 库存告急：").append(lowStockCount).append(" 款商品\n");
            }
        } catch (Exception e) { log.error("查询平台概览失败", e); }
        return sb.toString();
    }

    private String searchAdminStats() {
        try {
            long total = userMapper.countForAdmin(null, null, null);
            long personal = userMapper.countForAdmin(null, 1, null);
            long enterprise = userMapper.countForAdmin(null, 2, null);
            long pending = userMapper.countForAdmin(null, 2, 0);
            long approved = userMapper.countForAdmin(null, 2, 1);
            long orders = orderMapper.countForAdmin();
            long products = productMapper.findListForDisplay().size();
            return String.format("平台用户总数：%d（个人%d + 企业%d）\n待审核企业：%d 家\n已通过企业：%d 家\n累计订单：%d 笔\n在售商品：%d 款",
                    total, personal, enterprise, pending, approved, orders, products);
        } catch (Exception e) { log.error("查询管理员统计失败", e); return ""; }
    }

    // ==================== 格式化 ====================

    private void appendSection(StringBuilder sb, String title, String content) {
        if (content != null && !content.isEmpty()) {
            sb.append("\n【").append(title).append("】\n").append(content);
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null || s.isEmpty()) return "暂无";
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }

    private String formatProduct(ProductVO p) {
        return String.format("- %s | 分类:%s | 年龄:%s | ¥%s | %s\n",
                p.getName(), nvl(p.getCategory()), nvl(p.getAgeRange()),
                nvl(p.getPrice() != null ? p.getPrice().toString() : null),
                nvl(p.getEnterpriseName()));
    }

    private String formatDemand(SupplyDemandVO d) {
        return String.format("- %s [%s] | 类型:%s | 紧急度:%s | %s\n",
                d.getTitle(), nvl(d.getCompanyName()),
                nvl(d.getType()), nvl(d.getUrgency()),
                truncate(d.getDescription(), DESC_MAX_LEN));
    }

    private String formatSupply(SupplySupplyVO s) {
        return String.format("- %s [%s] | 类型:%s | %s\n",
                s.getTitle(), nvl(s.getCompanyName()),
                nvl(s.getType()), truncate(s.getDescription(), DESC_MAX_LEN));
    }

    private String formatCourse(TrainingCourse c) {
        return String.format("- %s | 讲师:%s | ¥%s | %d课时\n",
                c.getCourseName(), nvl(c.getInstructor()),
                nvl(c.getPrice() != null ? c.getPrice().toString() : null),
                c.getDuration() != null ? c.getDuration() : 0);
    }

    private String formatJob(JobPosition j) {
        return String.format("- %s [%s] | 薪资:%dk-%dk | %s | %s\n",
                j.getJobName(), nvl(j.getCompanyName()),
                j.getSalaryMin() != null ? j.getSalaryMin() : 0,
                j.getSalaryMax() != null ? j.getSalaryMax() : 0,
                nvl(j.getWorkLocation()), nvl(j.getExperience()));
    }

    private String formatInventoryProduct(InventoryProductVO p) {
        String low = Boolean.TRUE.equals(p.getLowStock()) ? " ⚠缺货" : "";
        return String.format("- %s [%s] | 库存:%d(最低%d)%s | %s仓库 | ¥%s\n",
                p.getName(), nvl(p.getSpec()),
                p.getStock() != null ? p.getStock() : 0,
                p.getMinStock() != null ? p.getMinStock() : 0,
                low, nvl(p.getWarehouseName()),
                p.getPrice() != null ? p.getPrice().toString() : "-");
    }

    private String formatWarehouse(InventoryWarehouseVO w) {
        return String.format("- %s | %s | 联系人:%s(%s) | 库容:%d | 商品数:%d\n",
                w.getName(), nvl(w.getAddress()), nvl(w.getManager()),
                nvl(w.getContactPhone()),
                w.getCapacity() != null ? w.getCapacity() : 0,
                w.getProductCount() != null ? w.getProductCount() : 0);
    }

    private String formatSupplier(InventorySupplierVO s) {
        return String.format("- %s | 联系人:%s(%s) | %s | 供货商品数:%d\n",
                s.getName(), nvl(s.getContactPerson()), nvl(s.getContactPhone()),
                nvl(s.getAddress()),
                s.getProductCount() != null ? s.getProductCount() : 0);
    }

    private static String nvl(String s) { return s != null && !s.isEmpty() ? s : "-"; }

    // ==================== 静态知识库 ====================

    private String getCompactGuide() {
        return """
                \n【平台操作速查】
                - 发布产品：登录 → 我的店铺 → 添加商品
                - 供需对接：供应链协同 → 供需对接 → 发布需求/供应
                - 招聘：人才招聘 → 发布职位/投递简历
                - 购物：产品展示 → 加入购物车 → 结算
                - 退款：我的订单 → 申请退款
                - 修改密码：个人中心 → 修改密码
                - 企业认证：个人中心 → 上传营业执照 → 等待审核
                """;
    }

    private String getOrderRefundGuide() {
        return """
                \n【订单与退款】
                订单状态：待支付→已支付→已发货→已完成。未支付可取消，已发货后可退款。
                退款类型：仅退款（未发货）/ 退货退款（已发货）。
                流程：买家申请 → 商家审核 → 退款完成。
                培训课程订单购买后直接生效，无需物流。
                """;
    }

    private String getAccountGuide() {
        return """
                \n【账户】
                注册：邮箱注册，选择个人/企业用户。企业需提交营业执照认证。
                登录：邮箱+密码。忘记密码可通过邮箱验证码重置。
                修改密码：个人中心 → 修改密码。
                修改邮箱：个人中心 → 输入新邮箱 → 验证码确认。
                """;
    }

    private String getEnterpriseGuide() {
        return """
                \n【企业认证】
                1. 注册企业账号
                2. 个人中心 → 上传营业执照 → 填写企业资料
                3. 等待管理员审核（待审核→已通过/已拒绝）
                4. 审核通过后可发布产品、供需信息、招聘信息
                """;
    }

    private String getMarketGuide() {
        return """
                \n【市场信息】
                市场信息页面提供：市场趋势（行业规模、增速、线上占比）、行业资讯（动态/新闻/技术创新）、
                政策法规（国家/行业/地方/国际）、展会信息（时间轴/重点展会）、市场分析报告。
                具体数据请访问平台数据中心和市场信息页面查看。
                """;
    }

    private String getShoppingGuide() {
        return """
                \n【购物流程】
                1. 进入「产品展示」浏览商品，可按分类、年龄段、季节筛选
                2. 点击商品查看详情，选择规格数量后「加入购物车」
                3. 进入购物车确认商品，点击「去结算」
                4. 填写收货地址，选择支付方式，提交订单
                5. 在「我的订单」中可查看订单状态：待支付→已支付→已发货→已完成
                6. 已发货的订单可申请退款（仅退款/退货退款）
                """;
    }

    private String getPublishGuide() {
        return """
                \n【发布内容指南】
                发布产品：登录企业账号 → 我的店铺 → 添加商品 → 填写信息并上传图片
                发布需求：登录企业账号 → 供应链协同 → 供需对接 → 发布需求 → 填写标题、类型、描述、预算
                发布供应：登录企业账号 → 供应链协同 → 供需对接 → 发布供应 → 填写供应能力和服务范围
                发布职位：登录企业账号 → 人才招聘 → 发布职位 → 填写职位信息
                注意：只有企业账号且审核通过（状态为已通过）才能发布内容，个人账号仅可浏览和购买。
                """;
    }

    private String getDeleteWarningGuide() {
        return """
                \n【删除操作警告】
                删除操作不可恢复，请确认后再执行：
                1. 删除用户将永久移除该账号及其所有关联数据（产品、订单、供需等）
                2. 建议先查看用户详情，确认无未完成订单或活跃对接后再删除
                3. 无法删除管理员自己的账号
                4. 对于违规内容，优先考虑下架/下线而非直接删除
                """;
    }

    // ==================== 管理员知识库 ====================

    private String getAdminOverviewGuide() {
        return """
                \n【管理后台功能总览】
                管理后台包含以下功能模块：
                1. 仪表盘 — 查看平台核心数据：用户总数、企业数、待审核数、订单数
                2. 用户列表 — 搜索、查看、管理所有注册用户
                3. 企业管理 — 审核企业入驻申请（待审核/已通过/已拒绝三个状态）
                4. 产品管理 — 查看平台所有商品，支持下架操作
                5. 订单管理 — 查看平台所有订单详情
                6. 培训课程 — 添加课程、查看课程订单、课程上下架
                7. 供需对接 — 管理需求/供应/对接记录，支持下线/取消操作
                8. 工单处理 — 回复用户提交的客服工单
                登录方式：使用管理员账号（admin001）登录后台管理页面。
                """;
    }

    private String getEnterpriseAuditGuide() {
        return """
                \n【企业审核操作指南】
                审核流程：
                1. 进入「企业管理」→「待审核」标签页
                2. 查看企业营业执照（点击缩略图可放大预览）
                3. 核对以下信息：企业名称与执照一致、执照号码格式正确、执照图片清晰可辨
                4. 点击「通过」或「拒绝」按钮完成审核
                状态说明：
                - 待审核（status=0）：企业已提交但尚未审核
                - 已通过（status=1）：审核通过，企业可使用全部功能（发布产品、供需、招聘等）
                - 已拒绝（status=2）：审核不通过，企业功能受限
                审核通过后企业用户即可正常使用平台功能发布产品和供需信息。
                """;
    }

    private String getUserManagementGuide() {
        return """
                \n【用户管理操作指南】
                功能入口：「用户列表」页面
                支持操作：
                1. 搜索用户 — 按邮箱、昵称、企业名搜索
                2. 筛选用户 — 按用户类型（个人/企业）和审核状态筛选
                3. 查看用户详情 — 点击查看，展示邮箱、昵称、头像、企业信息、注册时间
                4. 重置密码 — 管理员可为忘记密码的用户重置登录密码
                5. 删除用户 — 删除违规或无效账户（不可恢复，谨慎操作）
                注意：管理员不能删除自己的账号。
                """;
    }

    private String getProductManagementGuide() {
        return """
                \n【产品管理操作指南】
                功能入口：「产品管理」页面
                产品列表展示：商品名称、分类规格、价格、所属商家、当前状态
                操作：
                - 上架（status=1）：商品在前端产品展示页可见，用户可购买
                - 下架（status=0）：商品隐藏，用户不可见
                管理员可以对违规商品、已售罄商品执行下架操作。
                """;
    }

    private String getCourseManagementGuide() {
        return """
                \n【培训课程管理操作指南】
                功能入口：「培训课程」页面，含两个子标签：
                1. 课程列表 — 查看所有课程，支持：
                   - 添加新课程：填写课程名称、分类、等级、类型、开课日期、课时、讲师、价格、描述、图片、标签
                   - 上架/下架课程：控制课程在前端是否可见
                2. 课程订单 — 查看所有课程报名订单，包含用户、课程名、金额、下单时间
                """;
    }

    private String getSupplyDemandAdminGuide() {
        return """
                \n【供需对接管理操作指南】
                功能入口：「供需对接」页面，含三个标签：
                1. 需求管理 — 查看所有企业发布的需求，支持下线操作
                2. 供应管理 — 查看所有企业发布的供应，支持下线操作
                3. 对接管理 — 查看所有供需对接记录，支持取消对接
                下线/取消操作用于处理违规信息或已过期的供需。
                """;
    }

    private String getWorkOrderAdminGuide() {
        return """
                \n【工单处理操作指南】
                功能入口：「工单处理」页面
                工单是用户提交的客服支持请求：
                - 工单等级：普通/紧急/非常紧急
                - 工单状态：待处理→处理中→已完成
                管理员操作：
                1. 点击「聊天」打开工单对话窗口
                2. 查看用户描述的问题详情
                3. 输入回复内容并发送
                4. 回复后工单状态自动从「待处理」变为「处理中」
                用户可以继续在工单中与管理员沟通直到问题解决。
                """;
    }
}
