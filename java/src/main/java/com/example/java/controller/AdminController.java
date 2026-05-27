package com.example.java.controller;

import com.example.java.common.R;
import com.example.java.dto.TrainingCourseCreateRequest;
import com.example.java.dto.admin.AdminCourseOrderPageResult;
import com.example.java.dto.admin.AdminCoursePageResult;
import com.example.java.dto.admin.AdminOrderPageResult;
import com.example.java.dto.admin.AdminProductPageResult;
import com.example.java.dto.admin.AdminStatsDTO;
import com.example.java.dto.admin.AdminSupplyConnectionPageResult;
import com.example.java.dto.admin.AdminSupplyDemandPageResult;
import com.example.java.dto.admin.AdminSupplySupplyPageResult;
import com.example.java.dto.admin.AdminUserPageResult;
import com.example.java.dto.admin.AdminUserVO;
import com.example.java.entity.TrainingCourse;
import com.example.java.entity.User;
import com.example.java.mapper.SupplyConnectionMapper;
import com.example.java.mapper.SupplyDemandMapper;
import com.example.java.mapper.SupplySupplyMapper;
import com.example.java.mapper.TrainingCourseOrderMapper;
import com.example.java.service.AdminUserService;
import com.example.java.service.OrderService;
import com.example.java.service.ProductService;
import com.example.java.service.TrainingCourseService;
import com.example.java.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 后台管理系统专用接口（与业务端 /api/auth 分离）
 * 路径前缀：/api/admin
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService adminUserService;
    private final UserService userService;
    private final ProductService productService;
    private final OrderService orderService;
    private final TrainingCourseService trainingCourseService;
    private final TrainingCourseOrderMapper trainingCourseOrderMapper;
    private final SupplyDemandMapper supplyDemandMapper;
    private final SupplySupplyMapper supplySupplyMapper;
    private final SupplyConnectionMapper supplyConnectionMapper;

    /**
     * 判断用户是否为管理员，仅通过 is_admin 字段判断
     */
    private static boolean isAdminUser(User user) {
        return user != null && user.hasAdminRole();
    }

    private User requireAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : null;
        User admin = email != null ? userService.getUserByEmail(email) : null;
        if (!isAdminUser(admin)) {
            throw new com.example.java.exception.BusinessException(403, "无权限访问后台管理");
        }
        return admin;
    }

    /**
     * 仪表盘统计
     */
    @GetMapping("/stats")
    public R<AdminStatsDTO> getStats() {
        requireAdmin();
        AdminStatsDTO stats = adminUserService.getStats();
        return R.success(stats);
    }

    /**
     * 用户列表（分页、搜索、类型与状态筛选）
     * @param page 页码，从 1 开始
     * @param pageSize 每页条数
     * @param search 关键词（邮箱/昵称/企业名）
     * @param userType 用户类型 1=个人 2=企业
     * @param status 企业审核状态 0=待审核 1=已通过 2=已拒绝（仅当 userType=2 时有效）
     */
    @GetMapping("/users")
    public R<AdminUserPageResult> getUsers(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "15") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer userType,
            @RequestParam(required = false) Integer status) {
        requireAdmin();
        Integer enterpriseStatus = (userType != null && userType == 2) ? status : null;
        AdminUserPageResult result = adminUserService.getUsersPage(page, pageSize, search, userType, enterpriseStatus);
        return R.success(result);
    }

    /**
     * 用户详情（用于审核弹窗等）
     */
    @GetMapping("/users/{userId}")
    public R<AdminUserVO> getUserDetail(@PathVariable String userId) {
        requireAdmin();
        AdminUserVO vo = adminUserService.getUserDetail(userId);
        if (vo == null) {
            return R.error(404, "用户不存在");
        }
        return R.success(vo);
    }

    /**
     * 更新企业用户审核状态
     */
    @PutMapping("/users/{userId}/status")
    public R<Void> updateUserStatus(@PathVariable String userId, @RequestBody java.util.Map<String, Integer> body) {
        requireAdmin();
        Integer status = body != null ? body.get("status") : null;
        if (status == null) {
            return R.error(400, "缺少 status 参数");
        }
        if (status != 0 && status != 1 && status != 2) {
            return R.error(400, "status 只能为 0/1/2");
        }
        userService.updateEnterpriseStatus(userId, status);
        return R.success("操作成功", null);
    }

    /**
     * 管理员重置用户密码
     */
    @PutMapping("/users/{userId}/password")
    public R<Void> resetPassword(@PathVariable String userId,
                                 @Valid @RequestBody com.example.java.dto.AdminResetPasswordRequest request) {
        requireAdmin();
        userService.adminResetPassword(userId, request.getNewPassword());
        return R.success("密码重置成功", null);
    }

    /**
     * 管理员删除用户
     */
    @DeleteMapping("/users/{userId}")
    public R<Void> deleteUser(@PathVariable String userId) {
        User admin = requireAdmin();
        if (userId.equals(admin.getId())) {
            return R.error(400, "管理员不能注销自己");
        }
        userService.deleteUser(userId);
        return R.success("用户已注销", null);
    }

    /**
     * 管理端：产品分页列表
     */
    @GetMapping("/products")
    public R<AdminProductPageResult> getProducts(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        AdminProductPageResult result = productService.listForAdmin(page, pageSize);
        return R.success(result);
    }

    /**
     * 管理端：下架/上架商品
     */
    @PutMapping("/products/{productId}/status")
    public R<Void> updateProductStatus(@PathVariable String productId,
                                        @RequestBody java.util.Map<String, Integer> body) {
        requireAdmin();
        Integer status = body != null ? body.get("status") : null;
        if (status == null) {
            return R.error(400, "缺少 status 参数");
        }
        if (status != 0 && status != 1) {
            return R.error(400, "status 只能为 0(下架) 或 1(上架)");
        }
        productService.adminUpdateStatus(productId, status);
        return R.success(status == 1 ? "已上架" : "已下架", null);
    }

    /**
     * 管理端：订单分页列表（买家、卖家、商品）
     */
    @GetMapping("/orders")
    public R<AdminOrderPageResult> getOrders(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        AdminOrderPageResult result = orderService.listOrdersForAdmin(page, pageSize);
        return R.success(result);
    }

    /**
     * 管理端：培训课程分页列表
     */
    @GetMapping("/courses")
    public R<AdminCoursePageResult> getCourses(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        AdminCoursePageResult result = trainingCourseService.listForAdmin(page, pageSize);
        return R.success(result);
    }

    /**
     * 管理端：新增培训课程
     */
    @PostMapping("/courses")
    public R<TrainingCourse> addCourse(@Valid @RequestBody TrainingCourseCreateRequest request) {
        requireAdmin();
        TrainingCourse course = trainingCourseService.addCourse(request);
        return R.success("添加成功", course);
    }

    /**
     * 管理端：上架/下架培训课程
     */
    @PutMapping("/courses/{courseId}/status")
    public R<Void> updateCourseStatus(@PathVariable int courseId,
                                      @RequestBody java.util.Map<String, Integer> body) {
        requireAdmin();
        Integer status = body != null ? body.get("status") : null;
        if (status == null) {
            return R.error(400, "缺少 status 参数");
        }
        if (status != 0 && status != 1) {
            return R.error(400, "status 只能为 0(下架) 或 1(上架)");
        }
        trainingCourseService.adminUpdateStatus(courseId, status);
        return R.success(status == 1 ? "已上架" : "已下架", null);
    }

    /**
     * 管理端：课程订单分页列表
     */
    @GetMapping("/course-orders")
    public R<AdminCourseOrderPageResult> getCourseOrders(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = trainingCourseOrderMapper.countForAdmin();
        var list = trainingCourseOrderMapper.selectAllForAdmin(offset, limit);
        return R.success(new AdminCourseOrderPageResult(list, total));
    }

    /**
     * 管理端：需求信息分页列表
     */
    @GetMapping("/supply-demands")
    public R<AdminSupplyDemandPageResult> getSupplyDemands(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = supplyDemandMapper.countForAdmin();
        var list = supplyDemandMapper.findListForAdmin(offset, limit);
        return R.success(new AdminSupplyDemandPageResult(list, total));
    }

    /**
     * 管理端：供应信息分页列表
     */
    @GetMapping("/supply-supplies")
    public R<AdminSupplySupplyPageResult> getSupplySupplies(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = supplySupplyMapper.countForAdmin();
        var list = supplySupplyMapper.findListForAdmin(offset, limit);
        return R.success(new AdminSupplySupplyPageResult(list, total));
    }

    /**
     * 管理端：对接记录分页列表
     */
    @GetMapping("/supply-connections")
    public R<AdminSupplyConnectionPageResult> getSupplyConnections(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int pageSize) {
        requireAdmin();
        int offset = (page - 1) * pageSize;
        int limit = Math.max(1, pageSize);
        long total = supplyConnectionMapper.countForAdmin();
        var list = supplyConnectionMapper.findListForAdmin(offset, limit);
        return R.success(new AdminSupplyConnectionPageResult(list, total));
    }

    /**
     * 管理端：下架需求信息
     */
    @PutMapping("/supply-demands/{id}/status")
    public R<Void> updateDemandStatus(@PathVariable Integer id,
                                      @RequestBody java.util.Map<String, String> body) {
        requireAdmin();
        String status = body != null ? body.get("status") : null;
        if (status == null || !"offline".equals(status)) {
            return R.error(400, "status 必须为 'offline'");
        }
        supplyDemandMapper.updateStatus(id, "offline");
        return R.success("已下架", null);
    }

    /**
     * 管理端：下架供应信息
     */
    @PutMapping("/supply-supplies/{id}/status")
    public R<Void> updateSupplyStatus(@PathVariable Integer id,
                                       @RequestBody java.util.Map<String, String> body) {
        requireAdmin();
        String status = body != null ? body.get("status") : null;
        if (status == null || !"offline".equals(status)) {
            return R.error(400, "status 必须为 'offline'");
        }
        supplySupplyMapper.updateStatus(id, "offline");
        return R.success("已下架", null);
    }

    /**
     * 管理端：取消对接记录
     */
    @PutMapping("/supply-connections/{id}/status")
    public R<Void> updateConnectionStatus(@PathVariable Integer id,
                                          @RequestBody java.util.Map<String, String> body) {
        requireAdmin();
        String status = body != null ? body.get("status") : null;
        if (status == null || !"cancelled".equals(status)) {
            return R.error(400, "status 必须为 'cancelled'");
        }
        supplyConnectionMapper.updateStatus(id, "cancelled");
        return R.success("已取消", null);
    }
}
