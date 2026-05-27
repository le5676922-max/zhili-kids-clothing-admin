// API基础URL配置（公网走同域 /api，见 js/api-config.js / auth-header 内 ZhiliApi）
const API_BASE_URL = window.ZhiliApi.apiRoot();

// HTML转义工具函数
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', function() {
    // 选项卡切换功能
    const navItems = document.querySelectorAll('.supply-chain-nav li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            try {
                // 移除所有导航项的active类
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // 给当前点击的导航项添加active类
                this.classList.add('active');
                
                // 获取对应的选项卡ID
                const tabId = this.getAttribute('data-tab');
                
                if (!tabId) {
                    console.error('未找到data-tab属性');
                    return;
                }
                
                // 隐藏所有选项卡内容
                tabContents.forEach(tab => tab.classList.remove('active'));
                
                // 显示当前选项卡内容
                const targetTab = document.getElementById(tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                } else {
                    console.error('未找到ID为 ' + tabId + ' 的标签页内容');
                    return;
                }
                
                // 只有当切换到"供需对接"标签页时，才加载数据
                if (tabId === 'demand-supply') {
                    // 延迟加载，确保SupplyDemandManager已定义
                    setTimeout(() => {
                        if (typeof SupplyDemandManager !== 'undefined') {
                            if (SupplyDemandManager.apiData.demands.length === 0) {
                                SupplyDemandManager.loadDemandsFromAPI();
                            } else {
                                // 如果已有数据，直接更新列表
                                SupplyDemandManager.updateSupplyDemandList('demand');
                            }
                        } else {
                            console.warn('SupplyDemandManager未定义，延迟加载');
                            setTimeout(() => {
                                if (typeof SupplyDemandManager !== 'undefined') {
                                    SupplyDemandManager.loadDemandsFromAPI();
                                }
                            }, 500);
                        }
                    }, 300);
                }
            } catch (error) {
                console.error('标签页切换出错:', error);
            }
        });
    });
    
    // 如果默认显示的是"供需对接"标签页，则加载数据
    // 延迟更长时间，确保SupplyDemandManager已定义
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'demand-supply') {
        setTimeout(() => {
            if (typeof SupplyDemandManager !== 'undefined') {
                SupplyDemandManager.loadDemandsFromAPI();
            } else {
                console.warn('SupplyDemandManager未定义，延迟加载');
                // 如果还没定义，再延迟一次
                setTimeout(() => {
                    if (typeof SupplyDemandManager !== 'undefined') {
                        SupplyDemandManager.loadDemandsFromAPI();
                    }
                }, 500);
            }
        }, 500);
    }
    
    // 需求供应列表头部切换
    const headerTabs = document.querySelectorAll('.header-tab');
    
    headerTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有选项卡的active类
            headerTabs.forEach(t => t.classList.remove('active'));
            
            // 给当前点击的选项卡添加active类
            this.classList.add('active');
            
            // 这里可以添加切换需求/供应列表显示的逻辑
            toggleDemandSupplyList(this.textContent);
        });
    });
    
    function toggleDemandSupplyList(tabText) {
        // 使用新的供需对应管理器
        const cardList = document.querySelector('.card-list');
        
        // 如果cardList不存在（不在供需对接标签页），直接返回
        if (!cardList) {
            return;
        }
        
        // 保存当前滚动位置
        const scrollPos = window.pageYOffset;
        
        // 应用淡出效果
        cardList.style.opacity = '0';
        
        // 500毫秒后切换内容并应用淡入效果
        setTimeout(() => {
            // 确保SupplyDemandManager已定义
            if (typeof SupplyDemandManager === 'undefined') {
                console.warn('SupplyDemandManager未定义');
                cardList.style.opacity = '1';
                return;
            }
            
            if (tabText === '供应信息') {
                // 如果供应数据未加载，先加载
                if (SupplyDemandManager.apiData.supplies.length === 0) {
                    SupplyDemandManager.loadSuppliesFromAPI();
                } else {
                    SupplyDemandManager.updateSupplyDemandList('supply');
                }
            } else {
                // 如果需求数据未加载，先加载
                if (SupplyDemandManager.apiData.demands.length === 0) {
                    SupplyDemandManager.loadDemandsFromAPI();
                } else {
                    SupplyDemandManager.updateSupplyDemandList('demand');
                }
            }
            
            // 应用淡入效果
            cardList.style.opacity = '1';
            
            // 恢复滚动位置
            window.scrollTo(0, scrollPos);
            
        }, 300);
    }
    
    // 物流查询（调用后端API）
    const logisticsSearchForm = document.querySelector('.logistics-search .search-form');
    if (logisticsSearchForm) {
        logisticsSearchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const trackingNumber = this.querySelector('input').value.trim();
            if (!trackingNumber) { showNotification('请输入有效的运单号', 'warning'); return; }
            await queryLogistics(trackingNumber);
        });
    }

    async function queryLogistics(trackingNumber) {
        var logisticsSearch = document.querySelector('.logistics-search');
        // 移除旧结果
        var existing = document.querySelector('.tracking-result');
        if (existing) existing.remove();
        // 显示加载中
        var loading = document.createElement('div');
        loading.className = 'tracking-result';
        loading.style.cssText = 'background:#fff;border-radius:8px;padding:40px;margin-top:20px;text-align:center;color:#999;';
        loading.innerHTML = '<p>查询中...</p>';
        logisticsSearch.appendChild(loading);

        try {
            var res = await fetch(API_BASE_URL + '/logistics/track?trackingNo=' + encodeURIComponent(trackingNumber));
            var result = await res.json();
            loading.remove();
            if (result.code === 200 && result.data) {
                renderTrackingResult(result.data, trackingNumber);
                showNotification('物流信息查询成功', 'success');
            } else {
                logisticsSearch.appendChild(createTrackingEmpty('未找到运单 ' + trackingNumber + ' 的信息'));
            }
        } catch (err) {
            loading.remove();
            logisticsSearch.appendChild(createTrackingEmpty('查询失败，请检查网络'));
        }
    }

    function renderTrackingResult(order, trackingNumber) {
        var statusMap = { 'pending': '待支付', 'paid': '待发货', 'shipped': '配送中', 'completed': '已签收', 'cancelled': '已取消' };
        var statusText = order.statusText || statusMap[order.status] || order.status;
        var result = document.createElement('div');
        result.className = 'tracking-result';
        result.style.cssText = 'background:#fff;border-radius:8px;padding:20px;margin-top:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
        var itemsHtml = (order.items || []).map(function(i) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5;">'
                + (i.productImage ? '<img src="' + i.productImage + '" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">' : '')
                + '<div style="flex:1;"><div style="font-weight:500;">' + (i.productName || '商品') + '</div>'
                + '<div style="font-size:12px;color:#999;">¥' + (i.price || 0) + ' x ' + (i.quantity || 0) + '</div></div></div>';
        }).join('');
        result.innerHTML = '<div style="border-bottom:1px solid #eee;padding-bottom:15px;margin-bottom:15px;">'
            + '<h4 style="margin:0 0 8px 0;">运单号：' + trackingNumber + '</h4>'
            + '<p style="margin:5px 0;color:#666;">订单号：' + (order.id || '') + '</p>'
            + '<p style="margin:5px 0;color:#666;">收货人：' + (order.receiverName || '') + ' | ' + (order.receiverPhone || '') + '</p>'
            + '<p style="margin:5px 0;color:#666;">地址：' + (order.receiverAddress || '') + '</p>'
            + '<p style="margin:5px 0;">状态：<span style="background:#fff8e1;color:#ff8f00;padding:3px 10px;border-radius:12px;font-size:12px;">' + statusText + '</span></p>'
            + '</div>'
            + '<h5 style="margin:0 0 10px 0;">商品信息</h5>' + itemsHtml
            + '<p style="margin-top:15px;font-size:14px;color:#999;text-align:center;">详细物流轨迹请联系物流公司查询</p>';
        document.querySelector('.logistics-search').appendChild(result);
    }

    function createTrackingEmpty(msg) {
        var el = document.createElement('div');
        el.className = 'tracking-result';
        el.style.cssText = 'background:#fff;border-radius:8px;padding:40px;margin-top:20px;text-align:center;color:#999;';
        el.innerHTML = '<p>' + msg + '</p>';
        return el;
    }
    
    // 筛选表单提交
    const filterForm = document.querySelector('.filter-form');
    
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取筛选条件
            const filterData = {
                type: document.getElementById('demand-type').value,
                status: document.getElementById('demand-status').value,
                urgency: document.getElementById('demand-urgency').value,
                keyword: document.querySelector('.search-box input').value
            };
            
            // 模拟筛选
            simulateFiltering(filterData);
        });
    }
    
    // 模拟筛选效果
    function simulateFiltering(filterData) {
        // 显示筛选中提示
        showNotification('筛选中...', 'info');
        
        // 模拟延迟加载
        setTimeout(() => {
            // 获取所有需求卡片
            // 按实际关键词筛选
            const keyword = (searchInput && searchInput.value || '').toLowerCase().trim();
            const typeFilter = (typeSelect && typeSelect.value) || '';
            const statusFilter = (statusSelect && statusSelect.value) || '';
            const demandCards = document.querySelectorAll('.demand-card');
            let visibleCount = 0;

            demandCards.forEach(card => {
                const title = (card.querySelector('.demand-title') || {}).textContent || '';
                const desc = (card.querySelector('.demand-desc') || {}).textContent || '';
                const typeEl = card.querySelector('.badge, .demand-badge');
                const cardType = typeEl ? typeEl.textContent.trim() : '';
                let show = true;
                if (keyword && !title.toLowerCase().includes(keyword) && !desc.toLowerCase().includes(keyword)) {
                    show = false;
                }
                if (typeFilter && !cardType.includes(typeFilter)) {
                    show = false;
                }
                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            showNotification(`筛选完成，找到 ${visibleCount} 条符合条件的信息`, 'success');
        }, 800);
    }
    
    // 显示通知提示
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // 根据通知类型设置不同的样式
        let bgColor, textColor;
        
        switch(type) {
            case 'success':
                bgColor = '#4caf50';
                textColor = 'white';
                break;
            case 'warning':
                bgColor = '#ff9800';
                textColor = 'white';
                break;
            case 'error':
                bgColor = '#f44336';
                textColor = 'white';
                break;
            default:
                bgColor = '#4a6bdf';
                textColor = 'white';
        }
        
        // 设置样式
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = bgColor;
        notification.style.color = textColor;
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // 3秒后隐藏通知
        setTimeout(() => {
            notification.style.opacity = '0';
            
            // 完全隐藏后移除元素
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 模拟对接按钮点击事件
    const connectButtons = document.querySelectorAll('.btn-primary');
    
    connectButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('对接') || this.textContent.includes('联系') || this.textContent.includes('报价')) {
                // 获取卡片标题
                const cardTitle = this.closest('.demand-card').querySelector('h3').textContent;
                
                // 显示对接成功通知
                showNotification(`已成功发送对接请求：${cardTitle}`, 'success');
            }
        });
    });

    // 订单数据（可扩展）
    const allOrders = [
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
      // 可继续扩展更多订单...
    ];
    let orderPage = 1;
    const ORDERS_PER_PAGE = 5;

    function renderOrderTable(page) {
      const tbody = document.querySelector('.order-table tbody');
      tbody.innerHTML = '';
      const start = (page - 1) * ORDERS_PER_PAGE;
      const end = Math.min(start + ORDERS_PER_PAGE, allOrders.length);
      for (let i = start; i < end; i++) {
        const o = allOrders[i];
        tbody.innerHTML += `<tr>
          <td>${o.id}</td>
          <td>${o.customer}</td>
          <td>${o.type}</td>
          <td>${o.amount}</td>
          <td>${o.date}</td>
          <td>${o.delivery}</td>
          <td><span class="status-badge ${o.statusClass}">${o.status}</span></td>
          <td><button class="btn-sm view-order" data-order="${o.id}">查看</button></td>
        </tr>`;
      }
      // 隐藏查看更多按钮
      const moreBtn = document.getElementById('load-more-orders');
      if (end >= allOrders.length) {
        moreBtn.style.display = 'none';
      } else {
        moreBtn.style.display = '';
      }
      bindOrderDetailEvents();
    }

    function bindOrderDetailEvents() {
      document.querySelectorAll('.view-order').forEach(btn => {
        btn.onclick = function() {
          const orderId = this.getAttribute('data-order');
          showOrderDetail(orderId);
        };
      });
    }

    function showOrderDetail(orderId) {
      const order = allOrders.find(o => o.id === orderId);
      if (!order) return;
      const modal = document.getElementById('order-detail-modal');
      modal.innerHTML = `
        <div class="order-modal-mask" style="position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);z-index:9999;display:flex;align-items:center;justify-content:center;">
          <div class="order-modal-content" style="background:#fff;border-radius:10px;max-width:420px;width:90vw;padding:32px 24px;box-shadow:0 8px 32px rgba(0,0,0,0.18);position:relative;">
            <span class="order-modal-close" style="position:absolute;right:18px;top:12px;font-size:22px;cursor:pointer;">&times;</span>
            <h3 style="text-align:center;margin-bottom:18px;">订单详情</h3>
            <div style="margin-bottom:10px;"><strong>订单编号：</strong>${order.id}</div>
            <div style="margin-bottom:10px;"><strong>客户名称：</strong>${order.customer}</div>
            <div style="margin-bottom:10px;"><strong>产品类型：</strong>${order.type}</div>
            <div style="margin-bottom:10px;"><strong>订单金额：</strong>${order.amount}</div>
            <div style="margin-bottom:10px;"><strong>下单时间：</strong>${order.date}</div>
            <div style="margin-bottom:10px;"><strong>交货期：</strong>${order.delivery}</div>
            <div style="margin-bottom:10px;"><strong>订单状态：</strong><span class="status-badge ${order.statusClass}">${order.status}</span></div>
            <div style="margin-bottom:10px;"><strong>订单备注：</strong>${order.detail}</div>
          </div>
        </div>
      `;
      modal.style.display = 'block';
      // 关闭事件
      modal.querySelector('.order-modal-close').onclick = function() {
        modal.style.display = 'none';
      };
      // 点击遮罩关闭
      modal.querySelector('.order-modal-mask').onclick = function(e) {
        if (e.target === this) modal.style.display = 'none';
      };
    }

    // 分页加载更多订单
    const moreBtn = document.getElementById('load-more-orders');
    if (moreBtn) {
      moreBtn.onclick = function() {
        orderPage++;
        renderOrderTable(orderPage);
      };
    }
    // 首次渲染
    renderOrderTable(orderPage);
    
    // 优化方案模块交互功能
    initOptimizationModule();
});

// 优化方案模块初始化
function initOptimizationModule() {
    console.log('初始化优化方案模块');
    
    // 优化方案导航切换
    const optNavItems = document.querySelectorAll('.opt-nav-item');
    const optContents = document.querySelectorAll('.opt-content');
    
    console.log('找到优化导航项:', optNavItems.length);
    console.log('找到优化内容区:', optContents.length);
    
    optNavItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有导航项的active类
            optNavItems.forEach(nav => nav.classList.remove('active'));
            
            // 给当前点击的导航项添加active类
            this.classList.add('active');
            
            // 获取对应的选项卡ID
            const tabId = this.getAttribute('data-opt-tab');
            
            // 隐藏所有选项卡内容
            optContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
                content.style.opacity = '0';
            });
            
            // 显示当前选项卡内容
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
                
                // 添加淡入动画效果
                targetContent.style.opacity = '0';
                setTimeout(() => {
                    targetContent.style.opacity = '1';
                }, 50);
            }
        });
    });
    
    // 确保仓储优化内容默认显示
    const warehouseContent = document.getElementById('warehouse');
    if (warehouseContent) {
        warehouseContent.classList.add('active');
        warehouseContent.style.display = 'block';
        warehouseContent.style.opacity = '1';
        console.log('设置仓储优化为默认显示');
    }
    
    // 确保其他选项卡默认隐藏
    const otherContents = document.querySelectorAll('.opt-content:not(#warehouse)');
    otherContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
        content.style.opacity = '0';
    });
    
    // 统计卡片动画效果
    animateStatCards();
    
    // 优化前后对比数据动画
    animateComparisonData();
    
    // 综合效益数据动画
    animateBenefitValues();
}

// 统计卡片动画效果
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    // 使用Intersection Observer API实现滚动动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statValue = entry.target.querySelector('.stat-value');
                if (statValue) {
                    animateNumber(statValue);
                }
            }
        });
    }, { threshold: 0.5 });
    
    statCards.forEach(card => {
        observer.observe(card);
    });
}

// 数字动画效果
function animateNumber(element) {
    const finalValue = element.textContent;
    const isPercentage = finalValue.includes('%');
    const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
    
    if (isNaN(numericValue)) return;
    
    let currentValue = 0;
    const increment = numericValue / 50; // 50帧动画
    const duration = 1500; // 1.5秒
    const frameTime = duration / 50;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= numericValue) {
            currentValue = numericValue;
            clearInterval(timer);
        }
        
        if (isPercentage) {
            element.textContent = currentValue.toFixed(1) + '%';
        } else if (finalValue.includes('万元')) {
            element.textContent = currentValue.toFixed(0) + '万元/年';
        } else if (finalValue.includes('次/年')) {
            element.textContent = currentValue.toFixed(1) + '次/年';
        } else if (finalValue.includes('件/小时')) {
            element.textContent = currentValue.toFixed(0) + '件/小时';
        } else {
            element.textContent = currentValue.toFixed(1);
        }
    }, frameTime);
}

// 优化前后对比数据动画
function animateComparisonData() {
    const comparisonSections = document.querySelectorAll('.before-after-comparison, .route-optimization, .delivery-network');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const improvedValues = entry.target.querySelectorAll('.metric-value.improved, .value.improved, .stat-value');
                improvedValues.forEach(value => {
                    value.style.transform = 'scale(1.1)';
                    value.style.transition = 'transform 0.3s ease';
                    setTimeout(() => {
                        value.style.transform = 'scale(1)';
                    }, 300);
                });
            }
        });
    }, { threshold: 0.3 });
    
    comparisonSections.forEach(section => {
        observer.observe(section);
    });
}

// 综合效益数据动画
function animateBenefitValues() {
    const benefitValues = document.querySelectorAll('.benefit-value');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const valueElement = entry.target;
                animateNumber(valueElement);
            }
        });
    }, { threshold: 0.5 });
    
    benefitValues.forEach(value => {
        observer.observe(value);
    });
}

// 优化措施卡片悬停效果增强
document.addEventListener('DOMContentLoaded', function() {
    const measureCards = document.querySelectorAll('.measure-card');
    
    measureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.measure-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.measure-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
    
    // 统计卡片悬停效果
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.stat-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.stat-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
    
    // 初始化库存管理功能
    initInventoryManagement();
});

// 库存管理功能初始化
function initInventoryManagement() {
    // 功能卡片点击事件
    const functionCards = document.querySelectorAll('.function-card');
    
    functionCards.forEach(card => {
        card.addEventListener('click', function() {
            const functionType = this.getAttribute('data-function');
            openInventoryModal(functionType);
        });
    });
    
    // 模态框关闭事件
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', closeModal);
    });
    
    // 点击模态框外部关闭
    const modals = document.querySelectorAll('.inventory-modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });
    
    // 模态框内导航切换
    initModalNavigation();
    
    // 初始化表单功能
    initFormFunctions();
    
    // 初始化数据
    initInventoryData();
}

// 打开库存管理模态框
function openInventoryModal(functionType) {
    const modalMap = {
        'inbound': 'inboundModal',
        'outbound': 'outboundModal', 
        'transfer': 'transferModal',
        'analysis': 'analysisModal'
    };
    
    const modalId = modalMap[functionType];
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // 生成单号
            generateDocumentNumber(functionType);
            
            // 设置默认日期
            setDefaultDate(functionType);
            
            // 加载数据
            loadModalData(functionType);
        }
    }
}

// 关闭模态框
function closeModal() {
    const modals = document.querySelectorAll('.inventory-modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
}

// 模态框导航切换
function initModalNavigation() {
    const modalNavItems = document.querySelectorAll('.modal-nav-item');
    
    modalNavItems.forEach(item => {
        item.addEventListener('click', function() {
            const modal = this.closest('.inventory-modal');
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有active类
            modal.querySelectorAll('.modal-nav-item').forEach(nav => nav.classList.remove('active'));
            modal.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
            
            // 添加active类
            this.classList.add('active');
            const targetContent = modal.querySelector('#' + tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 生成单据号
function generateDocumentNumber(functionType) {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const timeStr = today.getHours().toString().padStart(2, '0') + 
                   today.getMinutes().toString().padStart(2, '0') + 
                   today.getSeconds().toString().padStart(2, '0');
    
    const prefixMap = {
        'inbound': 'RK',
        'outbound': 'CK',
        'transfer': 'DB'
    };
    
    const prefix = prefixMap[functionType];
    if (prefix) {
        const docNumber = prefix + dateStr + timeStr;
        const inputId = functionType + 'No';
        const input = document.getElementById(inputId);
        if (input) {
            input.value = docNumber;
        }
    }
}

// 设置默认日期
function setDefaultDate(functionType) {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = {
        'inbound': 'inboundDate',
        'outbound': 'outboundDate',
        'transfer': 'transferDate'
    };
    
    const inputId = dateInputs[functionType];
    if (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = today;
        }
    }
}

// 初始化表单功能
function initFormFunctions() {
    // 表单提交事件
    const forms = document.querySelectorAll('.inventory-form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    });
}

// 添加商品项
function addProductItem() {
    const productList = document.querySelector('.product-list');
    const newItem = document.createElement('div');
    newItem.className = 'product-item';
    newItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>商品名称</label>
                <input type="text" placeholder="请输入商品名称" required>
            </div>
            <div class="form-group">
                <label>规格型号</label>
                <input type="text" placeholder="请输入规格型号">
            </div>
            <div class="form-group">
                <label>数量</label>
                <input type="number" placeholder="请输入数量" min="1" required>
            </div>
            <div class="form-group">
                <label>单位</label>
                <select required>
                    <option value="">请选择</option>
                    <option value="件">件</option>
                    <option value="米">米</option>
                    <option value="公斤">公斤</option>
                </select>
            </div>
            <div class="form-group">
                <label>单价</label>
                <input type="number" step="0.01" placeholder="请输入单价">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-remove" onclick="removeProductItem(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    productList.appendChild(newItem);
}

// 删除商品项
function removeProductItem(button) {
    const productItem = button.closest('.product-item');
    const productList = productItem.parentNode;
    
    // 至少保留一个商品项
    if (productList.children.length > 1) {
        productItem.remove();
    } else {
        alert('至少需要保留一个商品项');
    }
}

// 搜索库存
function searchStock() {
    const searchInput = document.getElementById('stockSearch');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm) {
        // 在产品数据中搜索
        const results = InventoryDB.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.spec.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.id.toLowerCase().includes(searchTerm)
        ).map(product => ({
            id: product.id,
            name: product.name,
            spec: product.spec,
            stock: product.stock,
            unit: product.unit,
            price: product.price,
            category: product.category
        }));
        
        displayStockResults(results);
    } else {
        // 如果搜索为空，显示所有商品
        displayStockResults(InventoryDB.products.map(product => ({
            id: product.id,
            name: product.name,
            spec: product.spec,
            stock: product.stock,
            unit: product.unit,
            price: product.price,
            category: product.category
        })));
    }
}

// 显示库存搜索结果
function displayStockResults(results) {
    const productList = document.getElementById('outboundProductList');
    productList.innerHTML = '';
    
    if (results.length === 0) {
        productList.innerHTML = '<p class="no-data">未找到匹配的商品</p>';
        return;
    }
    
    results.forEach(item => {
        const stockStatus = item.stock < 10 ? 'low-stock' : item.stock > 100 ? 'high-stock' : 'normal-stock';
        const resultItem = document.createElement('div');
        resultItem.className = 'product-item';
        resultItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>商品编码</label>
                    <input type="text" value="${item.id}" readonly>
                </div>
                <div class="form-group">
                    <label>商品名称</label>
                    <input type="text" value="${item.name}" readonly>
                </div>
                <div class="form-group">
                    <label>规格型号</label>
                    <input type="text" value="${item.spec}" readonly>
                </div>
                <div class="form-group">
                    <label>商品分类</label>
                    <input type="text" value="${item.category}" readonly>
                </div>
                <div class="form-group">
                    <label>当前库存</label>
                    <input type="text" value="${item.stock}" readonly class="${stockStatus}">
                </div>
                <div class="form-group">
                    <label>出库数量</label>
                    <input type="number" placeholder="请输入出库数量" min="1" max="${item.stock}" required 
                           onchange="calculateAmount(this, ${item.price})">
                </div>
                <div class="form-group">
                    <label>单位</label>
                    <input type="text" value="${item.unit}" readonly>
                </div>
                <div class="form-group">
                    <label>单价</label>
                    <input type="text" value="¥${item.price}" readonly>
                </div>
                <div class="form-group">
                    <label>金额</label>
                    <input type="text" class="amount-field" readonly placeholder="¥0.00">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-remove" onclick="removeProductItem(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        productList.appendChild(resultItem);
    });
}

// 计算金额
function calculateAmount(quantityInput, price) {
    const quantity = parseInt(quantityInput.value) || 0;
    const amount = quantity * price;
    const amountField = quantityInput.closest('.product-item').querySelector('.amount-field');
    amountField.value = `¥${amount.toFixed(2)}`;
    
    // 更新总金额
    updateTotalAmount();
}

// 更新总金额
function updateTotalAmount() {
    const amountFields = document.querySelectorAll('.amount-field');
    let total = 0;
    
    amountFields.forEach(field => {
        const value = field.value.replace('¥', '').replace(',', '');
        total += parseFloat(value) || 0;
    });
    
    // 如果存在总金额显示区域，更新它
    const totalAmountElement = document.querySelector('.total-amount');
    if (totalAmountElement) {
        totalAmountElement.textContent = `总金额: ¥${total.toFixed(2)}`;
    }
}

// 处理表单提交（入库/出库/调拨）
async function handleFormSubmit(form) {
    const formData = new FormData(form);
    const modal = form.closest('.inventory-modal');
    const modalId = modal ? modal.id : '';
    const token = localStorage.getItem('token');

    // 构建提交数据
    var data = {};
    var products = [];
    var productItem = {};

    formData.forEach(function(value, key) {
        if (key === 'recordDate' || key === 'inbound_date' || key === 'outbound_date' || key === 'transfer_date') {
            data.date = value;
        } else if (key === 'productId') {
            productItem.productId = parseInt(value);
        } else if (key === 'quantity') {
            productItem.quantity = parseInt(value) || 0;
        } else if (key === 'price') {
            productItem.price = parseFloat(value) || 0;
        } else {
            data[key] = value;
        }
    });
    if (productItem.productId) products.push(productItem);
    data.products = products;

    try {
        var url = API_BASE_URL + '/inventory/';
        var method = 'POST';
        if (modalId.includes('inbound')) {
            url += 'inbound-records';
        } else if (modalId.includes('outbound')) {
            url += 'outbound-records';
            data.type = data.type || 'sale';
        } else if (modalId.includes('transfer')) {
            url += 'transfer-records';
            data.fromWarehouseId = parseInt(data.fromWarehouseId) || null;
            data.toWarehouseId = parseInt(data.toWarehouseId) || null;
        }

        var res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
            body: JSON.stringify(data)
        });
        var result = await res.json();
        if (result.code === 200) {
            alert('保存成功！');
            refreshTableData(modalId);
            switchToListView(modal);
            loadInventoryStats();
        } else {
            alert('保存失败: ' + (result.message || '未知错误'));
        }
    } catch (err) {
        console.error('保存失败:', err);
        alert('网络错误，请确认后端已启动');
    }
}

// 切换到列表视图
function switchToListView(modal) {
    const navItems = modal.querySelectorAll('.modal-nav-item');
    const tabContents = modal.querySelectorAll('.modal-tab-content');
    
    // 找到列表选项卡
    navItems.forEach((item, index) => {
        if (item.textContent.includes('记录')) {
            // 移除所有active类
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 激活列表选项卡
            item.classList.add('active');
            tabContents[index].classList.add('active');
        }
    });
}

// 加载模态框数据（使用后端API）
function loadModalData(functionType) {
    switch (functionType) {
        case 'inbound': loadInboundTable(); break;
        case 'outbound': loadOutboundTable(); break;
        case 'transfer': loadTransferTable(); break;
        case 'analysis': loadAnalysisData(); break;
    }
}

function refreshTableData(modalId) {
    if (modalId.includes('inbound')) loadInboundTable();
    else if (modalId.includes('outbound')) loadOutboundTable();
    else if (modalId.includes('transfer')) loadTransferTable();
    loadInventoryStats();
}

// 保留旧loadTableData供兼容（加载local InventoryDB的分页数据）
function loadTableData(tableBodyId) {
    const type = tableBodyId.replace('TableBody', '');
    if (type === 'inbound') loadInboundTable();
    else if (type === 'outbound') loadOutboundTable();
    else if (type === 'transfer') loadTransferTable();
}

// ===== API-backed table loaders (replacing InventoryDB mocks) =====
async function loadInboundTable() {
    var tbody = document.getElementById('inboundTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">加载中...</td></tr>';
    try {
        var res = await fetch(API_BASE_URL + '/inventory/inbound-records');
        var result = await res.json();
        if (result.code === 200 && Array.isArray(result.data)) {
            renderInboundRows(result.data, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无入库记录</td></tr>';
        }
    } catch (err) {
        console.error('加载入库记录失败:', err);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">加载失败</td></tr>';
    }
}
async function loadOutboundTable() {
    var tbody = document.getElementById('outboundTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">加载中...</td></tr>';
    try {
        var res = await fetch(API_BASE_URL + '/inventory/outbound-records');
        var result = await res.json();
        if (result.code === 200 && Array.isArray(result.data)) {
            renderOutboundRows(result.data, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无出库记录</td></tr>';
        }
    } catch (err) {
        console.error('加载出库记录失败:', err);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">加载失败</td></tr>';
    }
}
async function loadTransferTable() {
    var tbody = document.getElementById('transferTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">加载中...</td></tr>';
    try {
        var res = await fetch(API_BASE_URL + '/inventory/transfer-records');
        var result = await res.json();
        if (result.code === 200 && Array.isArray(result.data)) {
            renderTransferRows(result.data, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无调拨记录</td></tr>';
        }
    } catch (err) {
        console.error('加载调拨记录失败:', err);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">加载失败</td></tr>';
    }
}
async function loadInventoryStats() {
    try {
        var res = await fetch(API_BASE_URL + '/inventory/stats');
        var result = await res.json();
        if (result.code === 200 && result.data) {
            var s = result.data;
            var els = document.querySelectorAll('.inventory-stats .stat-value, .kpi-number');
            if (els.length >= 6) {
                els[0].textContent = s.totalProducts || 0;
                els[1].textContent = s.totalWarehouses || 0;
                els[2].textContent = s.totalSuppliers || 0;
                els[3].textContent = s.lowStockCount || 0;
                els[4].textContent = s.pendingInboundCount || 0;
                els[5].textContent = s.pendingOutboundCount || 0;
            }
        }
    } catch (err) { console.log('加载库存统计失败'); }
}

function renderInboundRows(records, tbody) {
    tbody.innerHTML = records.map(function(r) {
        var products = Array.isArray(r.products) ? r.products : [];
        var totalQty = products.reduce(function(s, p) { return s + (p.quantity || 0); }, 0);
        return '<tr><td>' + (r.recordNo || r.id) + '</td><td>' + (r.inboundDate || '') + '</td>'
            + '<td>' + (r.supplierName || '') + '</td><td>' + (r.warehouseName || '') + '</td>'
            + '<td>' + totalQty + '</td><td>' + getStatusText(r.status) + '</td>'
            + '<td>' + (r.operator || '') + '</td>'
            + '<td><button class="btn-sm" onclick="editRecord(' + r.id + ',\'inbound\')">编辑状态</button> '
            + '<button class="btn-sm btn-danger" onclick="deleteRecord(' + r.id + ',\'inbound\')">删除</button></td></tr>';
    }).join('');
}
function renderOutboundRows(records, tbody) {
    tbody.innerHTML = records.map(function(r) {
        var products = Array.isArray(r.products) ? r.products : [];
        var totalQty = products.reduce(function(s, p) { return s + (p.quantity || 0); }, 0);
        return '<tr><td>' + (r.recordNo || r.id) + '</td><td>' + (r.outboundDate || '') + '</td>'
            + '<td>' + getOutboundTypeText(r.type) + '</td><td>' + (r.warehouseName || '') + '</td>'
            + '<td>' + (r.targetName || '') + '</td><td>' + totalQty + '</td>'
            + '<td>' + getStatusText(r.status) + '</td><td>' + (r.operator || '') + '</td>'
            + '<td><button class="btn-sm" onclick="editRecord(' + r.id + ',\'outbound\')">编辑状态</button> '
            + '<button class="btn-sm btn-danger" onclick="deleteRecord(' + r.id + ',\'outbound\')">删除</button></td></tr>';
    }).join('');
}
function renderTransferRows(records, tbody) {
    tbody.innerHTML = records.map(function(r) {
        var products = Array.isArray(r.products) ? r.products : [];
        var totalQty = products.reduce(function(s, p) { return s + (p.quantity || 0); }, 0);
        return '<tr><td>' + (r.recordNo || r.id) + '</td><td>' + (r.transferDate || '') + '</td>'
            + '<td>' + (r.fromWarehouseName || '') + '</td><td>' + (r.toWarehouseName || '') + '</td>'
            + '<td>' + totalQty + '</td><td>' + getTransferReasonText(r.reason) + '</td>'
            + '<td>' + getStatusText(r.status) + '</td><td>' + (r.operator || '') + '</td>'
            + '<td><button class="btn-sm" onclick="editRecord(' + r.id + ',\'transfer\')">编辑状态</button> '
            + '<button class="btn-sm btn-danger" onclick="deleteRecord(' + r.id + ',\'transfer\')">删除</button></td></tr>';
    }).join('');
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待审核',
        'approved': '已审核', 
        'completed': '已完成',
        'processing': '进行中',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 获取出库类型文本
function getOutboundTypeText(type) {
    const typeMap = {
        'sale': '销售出库',
        'production': '生产领料',
        'transfer': '调拨出库',
        'return': '退货出库'
    };
    return typeMap[type] || type;
}

// 获取调拨原因文本
function getTransferReasonText(reason) {
    const reasonMap = {
        'shortage': '库存不足',
        'balance': '库存平衡',
        'maintenance': '仓库维护',
        'other': '其他原因'
    };
    return reasonMap[reason] || reason;
}

// 加载分析数据
function loadAnalysisData() {
    // 加载周转分析数据
    loadTurnoverData();
    
    // 加载报表数据
    loadReportData();
    
    // 初始化图表
    setTimeout(() => {
        initCharts();
    }, 100);
}

// 加载周转分析数据
function loadTurnoverData() {
    const tableBody = document.getElementById('turnoverTableBody');
    if (!tableBody) return;
    
    const mockData = [
        ['有机棉针织面料', '原材料', '200', '150', '175', '¥52,500', '8.5', '43', '良好'],
        ['童装印花面料', '原材料', '150', '89', '119.5', '¥35,850', '6.2', '59', '一般'],
        ['纽扣配件', '辅料', '1000', '500', '750', '¥7,500', '12.0', '30', '优秀']
    ];
    
    tableBody.innerHTML = '';
    mockData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join('');
        tableBody.appendChild(tr);
    });
}

// 加载报表数据
function loadReportData() {
    const tableBody = document.getElementById('reportTableBody');
    if (!tableBody) return;
    
    const mockData = [
        ['P001', '有机棉针织面料', '32支', '原料仓库', '200', '50', '100', '150', '¥45,000'],
        ['P002', '童装印花面料', '40支', '主仓库', '150', '30', '91', '89', '¥26,700'],
        ['P003', '纽扣配件', '12mm', '主仓库', '1000', '200', '700', '500', '¥5,000']
    ];
    
    tableBody.innerHTML = '';
    mockData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join('');
        tableBody.appendChild(tr);
    });
}

// 模拟数据库
const InventoryDB = {
    // 商品数据
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
    
    // 供应商数据
    suppliers: [
        { id: 'supplier1', name: '织里优质面料有限公司', contact: '张经理', phone: '0572-3856789', address: '湖州市织里镇工业园区A区' },
        { id: 'supplier2', name: '湖州印艺数码科技有限公司', contact: '李总', phone: '0572-3967890', address: '湖州市织里镇数码印花园' },
        { id: 'supplier3', name: '浙江童装辅料供应商', contact: '王主管', phone: '0572-3745612', address: '湖州市织里镇辅料市场B栋' },
        { id: 'supplier4', name: '江苏优质纺织有限公司', contact: '陈经理', phone: '0512-6789012', address: '江苏省苏州市纺织工业园' },
        { id: 'supplier5', name: '广东童装配件厂', contact: '刘总监', phone: '0769-8901234', address: '广东省东莞市童装产业园' }
    ],
    
    // 仓库数据
    warehouses: [
        { id: 'warehouse1', name: '主仓库', address: '织里镇中心仓储区1号', manager: '赵仓管', capacity: 5000 },
        { id: 'warehouse2', name: '原料仓库', address: '织里镇原料存储区2号', manager: '钱仓管', capacity: 3000 },
        { id: 'warehouse3', name: '成品仓库', address: '织里镇成品存储区3号', manager: '孙仓管', capacity: 4000 }
    ],
    
    // 客户/部门数据
    customers: [
        { id: 'dept1', name: '生产部', type: 'department', contact: '生产主管', phone: '内线001' },
        { id: 'dept2', name: '销售部', type: 'department', contact: '销售经理', phone: '内线002' },
        { id: 'dept3', name: '设计部', type: 'department', contact: '设计总监', phone: '内线003' },
        { id: 'customer1', name: '杭州童装批发市场', type: 'customer', contact: '采购部', phone: '0571-8888888' },
        { id: 'customer2', name: '上海儿童服饰连锁店', type: 'customer', contact: '区域经理', phone: '021-9999999' },
        { id: 'customer3', name: '北京童装专卖店', type: 'customer', contact: '店长', phone: '010-7777777' },
        { id: 'customer4', name: '广州童装贸易公司', type: 'customer', contact: '贸易经理', phone: '020-6666666' }
    ],
    
    // 入库记录
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
    
    // 出库记录
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
    
    // 调拨记录
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

// 供需对应数据库
const SupplyDemandDB = {
    // 需求信息
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
            specifications: {
                material: '全棉',
                count: '40支',
                width: '175cm',
                colors: ['白色', '浅蓝', '粉红'],
                quantity: '15000米',
                usage: '童装生产'
            },
            budget: '150000-200000',
            deadline: '2024-02-15',
            publishDate: '2024-01-10',
            tags: ['全棉', '针织面料', '40支'],
            location: '浙江省湖州市',
            requirements: [
                '面料质量符合国家童装标准',
                '色牢度达到4级以上',
                '甲醛含量低于20mg/kg',
                '支持小批量试样',
                '交货期不超过15天'
            ],
            attachments: [
                { name: '面料规格书.pdf', size: '2.3MB' },
                { name: '色卡参考.jpg', size: '1.8MB' }
            ]
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
            specifications: {
                printType: '数码印花',
                fabric: '纯棉、棉混纺',
                colors: '多色印花',
                quantity: '500-2000件/批',
                size: '80-160码'
            },
            budget: '8-15元/件',
            deadline: '2024-03-01',
            publishDate: '2024-01-12',
            tags: ['数码印花', '环保', '小批量'],
            location: '浙江省湖州市',
            requirements: [
                '使用环保水性墨水',
                '色牢度达到3-4级',
                '支持个性化定制',
                '交货周期7-10天',
                '提供打样服务'
            ],
            attachments: [
                { name: '印花设计稿.ai', size: '5.2MB' },
                { name: '工艺要求.docx', size: '0.8MB' }
            ]
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
            specifications: {
                ageGroup: '0-3岁',
                season: '春夏',
                style: '简约自然',
                theme: '自然探索',
                quantity: '10款',
                gender: '男女童通用'
            },
            budget: '5000-8000元/款',
            deadline: '2024-04-30',
            publishDate: '2024-01-15',
            tags: ['婴幼儿', '春夏', '设计服务'],
            location: '浙江省湖州市',
            requirements: [
                '具有3年以上童装设计经验',
                '熟悉婴幼儿服装安全标准',
                '提供完整设计方案',
                '包含款式图、工艺单',
                '支持后续打样指导'
            ],
            attachments: [
                { name: '品牌调性说明.pdf', size: '3.1MB' },
                { name: '参考图片.zip', size: '12.5MB' }
            ]
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
            specifications: {
                materials: ['塑料', '金属', '木质'],
                sizes: ['10mm', '12mm', '15mm', '18mm'],
                colors: '多色可选',
                quantity: '100000个',
                packaging: '按规格分装'
            },
            budget: '0.1-0.5元/个',
            deadline: '2024-02-20',
            publishDate: '2024-01-08',
            tags: ['纽扣', '配件', '批量采购'],
            location: '浙江省湖州市',
            requirements: [
                '符合童装安全标准',
                '无尖锐边角',
                '色牢度稳定',
                '支持定制LOGO',
                '包装完整无损'
            ],
            attachments: [
                { name: '纽扣规格表.xlsx', size: '1.2MB' }
            ]
        },
        {
            id: 'DM20240105005',
            title: '童装物流配送服务需求',
            type: 'logistics',
            category: '物流服务',
            urgency: 'medium',
            status: 'open',
            company: '江南童装贸易公司',
            contact: '刘经理',
            phone: '0572-9999999',
            email: 'liu@jiangnan-kids.com',
            description: '寻找专业的童装物流配送服务商，覆盖华东地区，要求时效快、包装好、价格合理。',
            specifications: {
                coverage: '华东地区',
                serviceType: '仓储+配送',
                timeLimit: '24-48小时',
                packaging: '专业童装包装',
                tracking: '全程可追踪'
            },
            budget: '8-12元/件',
            deadline: '2024-03-15',
            publishDate: '2024-01-20',
            tags: ['物流', '配送', '华东'],
            location: '浙江省湖州市',
            requirements: [
                '具有童装物流经验',
                '仓储环境干净整洁',
                '包装专业美观',
                '时效稳定可靠',
                '价格透明合理'
            ],
            attachments: [
                { name: '配送区域图.png', size: '2.8MB' },
                { name: '服务要求.pdf', size: '1.5MB' }
            ]
        },
        {
            id: 'DM20240106006',
            title: '童装拉链批量采购需求',
            type: 'accessory',
            category: '辅料配件需求',
            urgency: 'medium',
            status: 'open',
            company: '小天使童装有限公司',
            contact: '刘经理',
            phone: '0572-8888999',
            email: 'liu@xiaotianshi.com',
            description: '需要采购各种规格的童装拉链，包括尼龙拉链、金属拉链、隐形拉链等，用于秋冬童装生产。',
            specifications: {
                materials: ['尼龙', '金属', '树脂'],
                lengths: ['15cm', '20cm', '25cm', '30cm'],
                colors: ['黑色', '白色', '彩色'],
                quantity: '50000条',
                quality: 'A级品'
            },
            budget: '1.5-3元/条',
            deadline: '2024-03-15',
            publishDate: '2024-01-18',
            tags: ['拉链', '配件', '童装'],
            location: '浙江省湖州市',
            requirements: [
                '符合童装安全标准',
                '拉合顺滑无卡顿',
                '色牢度稳定',
                '支持定制长度',
                '包装规范整齐'
            ],
            attachments: [
                { name: '拉链规格需求.xlsx', size: '0.9MB' }
            ]
        },
        {
            id: 'DM20240107007',
            title: '童装绣花加工服务需求',
            type: 'processing',
            category: '加工服务需求',
            urgency: 'low',
            status: 'open',
            company: '梦幻童年服饰',
            contact: '周设计师',
            phone: '0572-7778888',
            email: 'zhou@menghuantn.com',
            description: '寻找专业的童装绣花加工厂，能够承接精细绣花工艺，包括电脑绣花、手工绣花等。',
            specifications: {
                embroideryTypes: ['电脑绣花', '手工绣花', '贴布绣'],
                fabrics: ['棉质', '丝绸', '混纺'],
                colors: '多色绣花',
                quantity: '1000-5000件/批',
                complexity: '中高复杂度'
            },
            budget: '10-30元/件',
            deadline: '2024-04-20',
            publishDate: '2024-01-20',
            tags: ['绣花', '手工艺', '精细加工'],
            location: '浙江省湖州市',
            requirements: [
                '绣花工艺精细',
                '色彩搭配协调',
                '支持个性化定制',
                '交货期稳定',
                '提供样品确认'
            ],
            attachments: [
                { name: '绣花图案设计.ai', size: '3.7MB' }
            ]
        },
        {
            id: 'DM20240108008',
            title: '环保童装面料采购',
            type: 'material',
            category: '原材料需求',
            urgency: 'high',
            status: 'open',
            company: '绿色童装制造有限公司',
            contact: '马总监',
            phone: '0572-9999000',
            email: 'ma@green-kids.com',
            description: '采购符合GOTS认证的有机棉面料，用于高端环保童装生产线，要求无化学残留。',
            specifications: {
                material: '有机棉',
                certification: 'GOTS认证',
                weight: '160-220g/m²',
                width: '150cm',
                colors: ['本白', '天然彩棉'],
                quantity: '20000米'
            },
            budget: '45-65元/米',
            deadline: '2024-02-28',
            publishDate: '2024-01-22',
            tags: ['有机棉', 'GOTS认证', '环保'],
            location: '浙江省湖州市',
            requirements: [
                'GOTS有机认证',
                '无化学残留',
                '可追溯原料来源',
                '提供认证证书',
                '支持小批量试订'
            ],
            attachments: [
                { name: 'GOTS认证要求.pdf', size: '2.1MB' }
            ]
        }
    ],
    
    // 供应信息
    supplies: [
        {
            id: 'SP20240101001',
            title: '优质童装面料供应',
            type: 'material',
            category: '原材料供应',
            status: 'available',
            company: '湖州优质纺织有限公司',
            contact: '赵厂长',
            phone: '0572-2222222',
            email: 'zhao@youzhifz.com',
            description: '专业生产各类童装面料，包括全棉、棉混纺、功能性面料等，质量稳定，价格优惠。',
            specifications: {
                materials: ['全棉', '棉混纺', '功能性面料'],
                width: '150-180cm',
                weight: '120-200g/m²',
                colors: '常规色+定制色',
                minOrder: '1000米/色'
            },
            price: '18-35元/米',
            capacity: '月产能50万米',
            publishDate: '2024-01-05',
            tags: ['童装面料', '全棉', '环保'],
            location: '浙江省湖州市',
            advantages: [
                '20年童装面料生产经验',
                'OEKO-TEX认证',
                '快速打样服务',
                '稳定供货能力',
                '技术支持完善'
            ],
            certifications: ['OEKO-TEX', 'GOTS', 'ISO9001'],
            attachments: [
                { name: '产品目录.pdf', size: '8.5MB' },
                { name: '认证证书.pdf', size: '3.2MB' }
            ]
        },
        {
            id: 'SP20240102002',
            title: '专业童装印花加工',
            type: 'processing',
            category: '加工服务',
            status: 'available',
            company: '织里印花工艺厂',
            contact: '孙师傅',
            phone: '0572-4444444',
            email: 'sun@zhiliprint.com',
            description: '专业从事童装印花加工，拥有先进的数码印花设备，环保工艺，交货快速。',
            specifications: {
                printTypes: ['数码印花', '丝网印花', '热转印'],
                fabrics: ['棉质', '混纺', '功能面料'],
                colors: '无限色彩',
                minOrder: '100件起',
                maxSize: 'A3幅面'
            },
            price: '5-20元/件',
            capacity: '日产能2000件',
            publishDate: '2024-01-08',
            tags: ['印花加工', '数码印花', '环保'],
            location: '浙江省湖州市',
            advantages: [
                '15年印花加工经验',
                '环保水性墨水',
                '色彩还原度高',
                '交货周期短',
                '支持小批量定制'
            ],
            certifications: ['环保认证', 'ISO14001'],
            attachments: [
                { name: '印花工艺介绍.pdf', size: '4.3MB' },
                { name: '作品展示.jpg', size: '6.8MB' }
            ]
        },
        {
            id: 'SP20240103003',
            title: '童装设计工作室',
            type: 'design',
            category: '设计服务',
            status: 'available',
            company: '创意童装设计工作室',
            contact: '林设计师',
            phone: '0572-6666666',
            email: 'lin@creative-kids.com',
            description: '专业童装设计团队，擅长0-12岁童装设计，风格多样，创意新颖，服务周到。',
            specifications: {
                ageRange: '0-12岁',
                styles: ['休闲', '正装', '运动', '时尚'],
                services: ['款式设计', '工艺指导', '打样跟进'],
                deliverables: ['设计图', '工艺单', '面料建议'],
                timeline: '7-15天/款'
            },
            price: '3000-10000元/款',
            capacity: '月设计能力30款',
            publishDate: '2024-01-10',
            tags: ['童装设计', '创意', '专业'],
            location: '浙江省湖州市',
            advantages: [
                '10年童装设计经验',
                '获得多项设计奖项',
                '深谙儿童心理',
                '紧跟时尚潮流',
                '一对一服务'
            ],
            certifications: ['设计师资格证', '版权保护'],
            attachments: [
                { name: '设计作品集.pdf', size: '15.2MB' },
                { name: '获奖证书.jpg', size: '2.1MB' }
            ]
        },
        {
            id: 'SP20240104004',
            title: '童装配件一站式供应',
            type: 'accessory',
            category: '辅料配件供应',
            status: 'available',
            company: '织里配件批发中心',
            contact: '钱老板',
            phone: '0572-5555777',
            email: 'qian@zhili-accessories.com',
            description: '专业供应各类童装配件，包括纽扣、拉链、织带、标签等，品种齐全，价格优惠。',
            specifications: {
                products: ['纽扣', '拉链', '织带', '标签', '魔术贴'],
                materials: ['塑料', '金属', '尼龙', '棉质'],
                colors: '全色系可选',
                minOrder: '1000个起',
                customization: '支持定制'
            },
            price: '0.1-5元/个',
            capacity: '月供应能力100万个',
            publishDate: '2024-01-12',
            tags: ['配件', '批发', '一站式'],
            location: '浙江省湖州市',
            advantages: [
                '15年配件供应经验',
                '品种齐全库存充足',
                '价格优势明显',
                '支持小批量采购',
                '快速发货服务'
            ],
            certifications: ['质量管理体系认证'],
            attachments: [
                { name: '产品目录大全.pdf', size: '12.3MB' },
                { name: '价格表.xlsx', size: '2.1MB' }
            ]
        },
        {
            id: 'SP20240105005',
            title: '专业童装物流配送',
            type: 'logistics',
            category: '物流服务',
            status: 'available',
            company: '快捷童装物流有限公司',
            contact: '运营部',
            phone: '0572-6666888',
            email: 'service@kuaijie-logistics.com',
            description: '专注童装行业物流配送，覆盖全国主要城市，提供仓储、包装、配送一体化服务。',
            specifications: {
                services: ['仓储管理', '包装服务', '配送运输', '代收货款'],
                coverage: '全国主要城市',
                timeLimit: '24-72小时',
                packaging: '专业童装包装',
                tracking: '全程跟踪'
            },
            price: '8-25元/件',
            capacity: '日处理能力5万件',
            publishDate: '2024-01-15',
            tags: ['物流', '配送', '仓储'],
            location: '浙江省湖州市',
            advantages: [
                '专业童装物流经验',
                '全国网络覆盖',
                '时效稳定可靠',
                '包装专业美观',
                '价格透明合理'
            ],
            certifications: ['物流企业资质', '安全认证'],
            attachments: [
                { name: '服务网络图.png', size: '4.2MB' },
                { name: '收费标准.pdf', size: '1.8MB' }
            ]
        },
        {
            id: 'SP20240106006',
            title: '高端童装绣花工艺',
            type: 'processing',
            category: '加工服务',
            status: 'available',
            company: '艺术绣花工作室',
            contact: '李师傅',
            phone: '0572-7777999',
            email: 'li@art-embroidery.com',
            description: '专业从事高端童装绣花加工，拥有精湛的手工绣花技艺和先进的电脑绣花设备。',
            specifications: {
                techniques: ['手工绣花', '电脑绣花', '立体绣', '珠片绣'],
                fabrics: ['丝绸', '棉质', '毛料', '混纺'],
                complexity: '简单到复杂全覆盖',
                minOrder: '50件起',
                sampleTime: '3-5天'
            },
            price: '15-80元/件',
            capacity: '月加工能力8000件',
            publishDate: '2024-01-18',
            tags: ['绣花', '手工艺', '高端'],
            location: '浙江省湖州市',
            advantages: [
                '20年绣花工艺经验',
                '获得多项工艺奖项',
                '手工与机器结合',
                '个性化定制服务',
                '质量精益求精'
            ],
            certifications: ['工艺美术师证书', '质量认证'],
            attachments: [
                { name: '绣花作品展示.pdf', size: '8.9MB' },
                { name: '工艺流程介绍.mp4', size: '25.6MB' }
            ]
        },
        {
            id: 'SP20240107007',
            title: '环保有机棉面料供应',
            type: 'material',
            category: '原材料供应',
            status: 'available',
            company: '绿色纺织科技有限公司',
            contact: '环保部经理',
            phone: '0572-8888777',
            email: 'eco@green-textile.com',
            description: '专业生产GOTS认证有机棉面料，无化学残留，适合高端环保童装制造。',
            specifications: {
                material: '100%有机棉',
                certifications: ['GOTS', 'OCS', 'OEKO-TEX'],
                weight: '120-300g/m²',
                width: '150-180cm',
                colors: '天然色+环保染色',
                minOrder: '500米/色'
            },
            price: '35-75元/米',
            capacity: '月产能20万米',
            publishDate: '2024-01-20',
            tags: ['有机棉', 'GOTS认证', '环保'],
            location: '浙江省湖州市',
            advantages: [
                'GOTS全球有机认证',
                '可追溯原料来源',
                '零化学残留',
                '环保染色工艺',
                '支持定制开发'
            ],
            certifications: ['GOTS', 'OCS', 'OEKO-TEX', 'ISO14001'],
            attachments: [
                { name: '有机认证证书.pdf', size: '3.5MB' },
                { name: '产品检测报告.pdf', size: '2.8MB' }
            ]
        }
    ],
    
    // 对接记录
    connections: [
        {
            id: 'CN20240101001',
            demandId: 'DM20240102002',
            supplyId: 'SP20240102002',
            status: 'negotiating',
            startDate: '2024-01-15',
            lastUpdate: '2024-01-20',
            notes: '双方已初步达成合作意向，正在商讨具体价格和交货期'
        },
        {
            id: 'CN20240102002',
            demandId: 'DM20240101001',
            supplyId: 'SP20240101001',
            status: 'completed',
            startDate: '2024-01-12',
            lastUpdate: '2024-01-18',
            completedDate: '2024-01-18',
            notes: '合作成功，已签订供货协议'
        }
    ]
};

// 初始化库存数据
function initInventoryData() {
    // 设置今天的日期为默认值
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // 初始化下拉选项
    initSelectOptions();
}

// 查看记录详情
function viewRecord(recordId, type) {
    let record = null;
    let title = '';
    
    switch (type) {
        case 'inbound':
            record = InventoryDB.inboundRecords.find(r => r.id === recordId);
            title = '入库单详情';
            break;
        case 'outbound':
            record = InventoryDB.outboundRecords.find(r => r.id === recordId);
            title = '出库单详情';
            break;
        case 'transfer':
            record = InventoryDB.transferRecords.find(r => r.id === recordId);
            title = '调拨单详情';
            break;
    }
    
    if (record) {
        showRecordDetailModal(record, title, type);
    }
}

// 编辑记录状态（切换审核/完成/取消）
async function editRecord(recordId, type) {
    var newStatus = prompt('请输入新状态 (pending/approved/completed/cancelled):', 'approved');
    if (!newStatus) return;
    var token = localStorage.getItem('token');
    var url = API_BASE_URL + '/inventory/';
    if (type === 'inbound') url += 'inbound-records/' + recordId + '/status?status=' + newStatus;
    else if (type === 'outbound') url += 'outbound-records/' + recordId + '/status?status=' + newStatus;
    else if (type === 'transfer') url += 'transfer-records/' + recordId + '/status?status=' + newStatus;
    else { alert('未知记录类型'); return; }
    try {
        var res = await fetch(url, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + (token || '') } });
        var result = await res.json();
        if (result.code === 200) {
            alert('状态更新成功！');
            if (type === 'inbound') loadInboundTable();
            else if (type === 'outbound') loadOutboundTable();
            else if (type === 'transfer') loadTransferTable();
            loadInventoryStats();
        } else {
            alert('状态更新失败: ' + (result.message || '未知错误'));
        }
    } catch (err) {
        console.error('状态更新失败:', err);
        alert('网络错误');
    }
}

// 删除记录（调用后端API）
async function deleteRecord(recordId, type) {
    if (!confirm('确定要删除这条记录吗？')) return;
    var token = localStorage.getItem('token');
    var url = API_BASE_URL + '/inventory/';
    if (type === 'inbound') url += 'inbound-records/';
    else if (type === 'outbound') url += 'outbound-records/';
    else if (type === 'transfer') url += 'transfer-records/';
    url += recordId;
    try {
        var res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + (token || '') } });
        var result = await res.json();
        if (result.code === 200) {
            alert('删除成功！');
            if (type === 'inbound') loadInboundTable();
            else if (type === 'outbound') loadOutboundTable();
            else if (type === 'transfer') loadTransferTable();
            loadInventoryStats();
        } else {
            alert('删除失败: ' + (result.message || '未知错误'));
        }
    } catch (err) {
        console.error('删除失败:', err);
        alert('网络错误');
    }
}

// 显示记录详情模态框
function showRecordDetailModal(record, title, type) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'inventory-modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <span class="modal-close" onclick="closeDetailModal(this)">&times;</span>
            </div>
            <div class="modal-body">
                <div class="record-detail">
                    ${generateRecordDetailHTML(record, type)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// 关闭详情模态框
function closeDetailModal(closeBtn) {
    const modal = closeBtn.closest('.inventory-modal');
    modal.remove();
    document.body.style.overflow = 'auto';
}

// 生成记录详情HTML
function generateRecordDetailHTML(record, type) {
    let html = `
        <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>单据号:</label>
                    <span>${record.id}</span>
                </div>
                <div class="detail-item">
                    <label>日期:</label>
                    <span>${record.date}</span>
                </div>
                <div class="detail-item">
                    <label>状态:</label>
                    <span class="status-badge ${record.status}">${getStatusText(record.status)}</span>
                </div>
                <div class="detail-item">
                    <label>操作员:</label>
                    <span>${record.operator}</span>
                </div>
    `;
    
    // 根据类型添加特定信息
    switch (type) {
        case 'inbound':
            const supplier = InventoryDB.suppliers.find(s => s.id === record.supplier);
            const warehouse = InventoryDB.warehouses.find(w => w.id === record.warehouse);
            html += `
                <div class="detail-item">
                    <label>供应商:</label>
                    <span>${supplier ? supplier.name : '未知供应商'}</span>
                </div>
                <div class="detail-item">
                    <label>仓库:</label>
                    <span>${warehouse ? warehouse.name : '未知仓库'}</span>
                </div>
                <div class="detail-item">
                    <label>总金额:</label>
                    <span>¥${record.totalAmount.toLocaleString()}</span>
                </div>
            `;
            break;
        case 'outbound':
            const outWarehouse = InventoryDB.warehouses.find(w => w.id === record.warehouse);
            const customer = InventoryDB.customers.find(c => c.id === record.customer);
            html += `
                <div class="detail-item">
                    <label>出库类型:</label>
                    <span>${getOutboundTypeText(record.type)}</span>
                </div>
                <div class="detail-item">
                    <label>仓库:</label>
                    <span>${outWarehouse ? outWarehouse.name : '未知仓库'}</span>
                </div>
                <div class="detail-item">
                    <label>客户/部门:</label>
                    <span>${customer ? customer.name : '未知客户'}</span>
                </div>
            `;
            break;
        case 'transfer':
            const fromWarehouse = InventoryDB.warehouses.find(w => w.id === record.fromWarehouse);
            const toWarehouse = InventoryDB.warehouses.find(w => w.id === record.toWarehouse);
            html += `
                <div class="detail-item">
                    <label>调出仓库:</label>
                    <span>${fromWarehouse ? fromWarehouse.name : '未知仓库'}</span>
                </div>
                <div class="detail-item">
                    <label>调入仓库:</label>
                    <span>${toWarehouse ? toWarehouse.name : '未知仓库'}</span>
                </div>
                <div class="detail-item">
                    <label>调拨原因:</label>
                    <span>${getTransferReasonText(record.reason)}</span>
                </div>
            `;
            break;
    }
    
    html += `
            </div>
        </div>
        <div class="detail-section">
            <h4>商品明细</h4>
            <div class="detail-table">
                <table>
                    <thead>
                        <tr>
                            <th>商品编码</th>
                            <th>商品名称</th>
                            <th>规格型号</th>
                            <th>数量</th>
                            <th>单位</th>
                            ${type === 'inbound' ? '<th>单价</th><th>金额</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    record.products.forEach(product => {
        const productInfo = InventoryDB.products.find(p => p.id === product.productId);
        html += `
            <tr>
                <td>${product.productId}</td>
                <td>${productInfo ? productInfo.name : '未知商品'}</td>
                <td>${productInfo ? productInfo.spec : '-'}</td>
                <td>${product.quantity}</td>
                <td>${productInfo ? productInfo.unit : '-'}</td>
                ${type === 'inbound' ? `<td>¥${product.price}</td><td>¥${(product.quantity * product.price).toFixed(2)}</td>` : ''}
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

// 初始化图表
function initCharts() {
    // 库存分布饼图
    initInventoryDistributionChart();
    
    // 库存趋势线图
    initInventoryTrendChart();
    
    // 周转率分析图
    initTurnoverChart();
    
    // 供应商分析图
    initSupplierChart();
}

// 库存分布饼图
function initInventoryDistributionChart() {
    const ctx = document.getElementById('inventoryDistributionChart');
    if (!ctx) return;
    
    // 计算各类别库存分布
    const categoryData = {};
    InventoryDB.products.forEach(product => {
        const category = product.category;
        if (!categoryData[category]) {
            categoryData[category] = { count: 0, value: 0 };
        }
        categoryData[category].count += product.stock;
        categoryData[category].value += product.stock * product.price;
    });
    
    const labels = Object.keys(categoryData);
    const data = labels.map(label => categoryData[label].count);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value}件 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 库存趋势线图
function initInventoryTrendChart() {
    const ctx = document.getElementById('inventoryTrendChart');
    if (!ctx) return;
    
    // 模拟最近7天的库存变化数据
    const dates = [];
    const inventoryData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        
        // 模拟库存变化（基于当前总库存的波动）
        const totalStock = InventoryDB.products.reduce((sum, product) => sum + product.stock, 0);
        const variation = Math.random() * 200 - 100; // ±100的随机变化
        inventoryData.push(Math.max(0, totalStock + variation));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '库存总量',
                data: inventoryData,
                borderColor: '#4a6bdf',
                backgroundColor: 'rgba(74, 107, 223, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4a6bdf',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4a6bdf',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + '件';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 周转率分析图
function initTurnoverChart() {
    const ctx = document.getElementById('turnoverChart');
    if (!ctx) return;
    
    // 计算各商品的周转率（模拟数据）
    const products = InventoryDB.products.slice(0, 8); // 取前8个商品
    const labels = products.map(p => p.name.length > 8 ? p.name.substring(0, 8) + '...' : p.name);
    const turnoverData = products.map(() => (Math.random() * 10 + 2).toFixed(1)); // 2-12的随机周转率
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '周转率(次/年)',
                data: turnoverData,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return `周转率: ${context.parsed.y}次/年`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + '次';
                        }
                    }
                }
            }
        }
    });
}

// 供应商分析图
function initSupplierChart() {
    const ctx = document.getElementById('supplierChart');
    if (!ctx) return;
    
    // 计算各供应商的供货量和金额
    const supplierData = {};
    InventoryDB.inboundRecords.forEach(record => {
        const supplier = InventoryDB.suppliers.find(s => s.id === record.supplier);
        if (supplier) {
            if (!supplierData[supplier.name]) {
                supplierData[supplier.name] = { amount: 0, count: 0 };
            }
            supplierData[supplier.name].amount += record.totalAmount;
            supplierData[supplier.name].count += 1;
        }
    });
    
    const labels = Object.keys(supplierData);
    const amounts = labels.map(label => supplierData[label].amount);
    const counts = labels.map(label => supplierData[label].count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(name => name.length > 10 ? name.substring(0, 10) + '...' : name),
            datasets: [{
                label: '采购金额(元)',
                data: amounts,
                backgroundColor: 'rgba(74, 107, 223, 0.8)',
                borderColor: '#4a6bdf',
                borderWidth: 1,
                yAxisID: 'y',
                borderRadius: 4
            }, {
                label: '采购次数',
                data: counts,
                type: 'line',
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 3,
                fill: false,
                yAxisID: 'y1',
                tension: 0.4,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        maxRotation: 45
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + '次';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 初始化下拉选项
function initSelectOptions() {
    // 供应商选项
    const supplierSelects = document.querySelectorAll('#supplier');
    supplierSelects.forEach(select => {
        select.innerHTML = '<option value="">请选择供应商</option>';
        InventoryDB.suppliers.forEach(supplier => {
            select.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
        });
    });
    
    // 仓库选项（仅保留调拨相关的选择器）
    const warehouseSelects = document.querySelectorAll('#fromWarehouse, #toWarehouse');
    warehouseSelects.forEach(select => {
        const placeholder = select.id === 'fromWarehouse' ? '请选择调出仓库' : 
                          select.id === 'toWarehouse' ? '请选择调入仓库' : '请选择仓库';
        select.innerHTML = `<option value="">${placeholder}</option>`;
        InventoryDB.warehouses.forEach(warehouse => {
            select.innerHTML += `<option value="${warehouse.id}">${warehouse.name}</option>`;
        });
    });
}

// 添加调拨商品项
function addTransferItem() {
    const productList = document.getElementById('transferProductList');
    if (!productList) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'product-item';
    newItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>商品名称</label>
                <select required>
                    <option value="">请选择商品</option>
                    ${InventoryDB.products.map(product => 
                        `<option value="${product.id}">${product.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>规格型号</label>
                <input type="text" readonly>
            </div>
            <div class="form-group">
                <label>当前库存</label>
                <input type="text" readonly>
            </div>
            <div class="form-group">
                <label>调拨数量</label>
                <input type="number" placeholder="请输入调拨数量" min="1" required>
            </div>
            <div class="form-group">
                <label>单位</label>
                <input type="text" readonly>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-remove" onclick="removeProductItem(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // 添加商品选择事件
    const select = newItem.querySelector('select');
    select.addEventListener('change', function() {
        const productId = this.value;
        const product = InventoryDB.products.find(p => p.id === productId);
        if (product) {
            const inputs = newItem.querySelectorAll('input');
            inputs[0].value = product.spec; // 规格
            inputs[1].value = product.stock; // 库存
            inputs[2].max = product.stock; // 设置最大调拨数量
            inputs[3].value = product.unit; // 单位
        }
    });
    
    productList.appendChild(newItem);
}

// 导出数据功能
function exportData(type, format) {
    let data = [];
    let filename = '';
    
    switch (type) {
        case 'inbound':
            data = InventoryDB.inboundRecords;
            filename = '入库记录';
            break;
        case 'outbound':
            data = InventoryDB.outboundRecords;
            filename = '出库记录';
            break;
        case 'transfer':
            data = InventoryDB.transferRecords;
            filename = '调拨记录';
            break;
        case 'inventory':
            data = InventoryDB.products;
            filename = '库存清单';
            break;
    }
    
    if (format === 'excel') {
        exportToExcel(data, filename);
    } else if (format === 'csv') {
        exportToCSV(data, filename);
    }
}

// 导出为CSV
function exportToCSV(data, filename) {
    if (data.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    // 获取表头
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    // 添加数据行
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            return `"${value}"`;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 导出为Excel（简化版）
function exportToExcel(data, filename) {
    if (data.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    let html = '<table border="1">';
    
    // 表头
    const headers = Object.keys(data[0]);
    html += '<tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr>';
    
    // 数据行
    data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            let value = row[header];
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            html += `<td>${value}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</table>';
    
    // 创建下载
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
}

// 高级搜索功能
function advancedSearch(type) {
    const modal = document.createElement('div');
    modal.className = 'inventory-modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>高级搜索 - ${type === 'inbound' ? '入库记录' : type === 'outbound' ? '出库记录' : '调拨记录'}</h3>
                <span class="modal-close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="advancedSearchForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>日期范围</label>
                            <input type="date" id="startDate">
                            <span style="margin: 0 10px;">至</span>
                            <input type="date" id="endDate">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>状态</label>
                            <select id="statusFilter">
                                <option value="">全部状态</option>
                                <option value="pending">待审核</option>
                                <option value="approved">已审核</option>
                                <option value="completed">已完成</option>
                                <option value="processing">进行中</option>
                                <option value="cancelled">已取消</option>
                            </select>
                        </div>
                        ${type === 'inbound' ? `
                        <div class="form-group">
                            <label>金额范围</label>
                            <input type="number" placeholder="最小金额" id="minAmount">
                            <input type="number" placeholder="最大金额" id="maxAmount">
                        </div>
                        ` : ''}
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-primary" onclick="performAdvancedSearch('${type}')">搜索</button>
                        <button type="button" class="btn-secondary" onclick="resetAdvancedSearch('${type}')">重置</button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// 执行高级搜索
function performAdvancedSearch(type) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const status = document.getElementById('statusFilter').value;
    const minAmount = parseFloat(document.getElementById('minAmount')?.value) || 0;
    const maxAmount = parseFloat(document.getElementById('maxAmount')?.value) || Infinity;
    
    let records;
    switch (type) {
        case 'inbound':
            records = InventoryDB.inboundRecords;
            break;
        case 'outbound':
            records = InventoryDB.outboundRecords;
            break;
        case 'transfer':
            records = InventoryDB.transferRecords;
            break;
    }
    
    const filteredRecords = records.filter(record => {
        // 日期过滤
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        
        // 状态过滤
        if (status && record.status !== status) return false;
        
        // 金额过滤（仅对入库记录）
        if (type === 'inbound' && record.totalAmount) {
            if (record.totalAmount < minAmount || record.totalAmount > maxAmount) return false;
        }
        
        return true;
    });
    
    // 显示搜索结果
    displaySearchResults(filteredRecords, type);
    closeModal();
    
    // 显示搜索结果提示
    alert(`找到 ${filteredRecords.length} 条符合条件的记录`);
}

// 显示搜索结果
function displaySearchResults(results, type) {
    // 临时存储原始数据
    const originalData = {
        inbound: [...InventoryDB.inboundRecords],
        outbound: [...InventoryDB.outboundRecords],
        transfer: [...InventoryDB.transferRecords]
    };
    
    // 替换为搜索结果
    switch (type) {
        case 'inbound':
            InventoryDB.inboundRecords = results;
            break;
        case 'outbound':
            InventoryDB.outboundRecords = results;
            break;
        case 'transfer':
            InventoryDB.transferRecords = results;
            break;
    }
    
    // 重新加载表格
    loadTableData(`${type}TableBody`);
    
    // 添加重置按钮
    const tableContainer = document.querySelector(`#${type}TableBody`).closest('.data-table');
    let resetBtn = tableContainer.querySelector('.reset-search-btn');
    if (!resetBtn) {
        resetBtn = document.createElement('button');
        resetBtn.className = 'btn-secondary reset-search-btn';
        resetBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> 显示全部记录';
        resetBtn.onclick = () => resetSearchResults(originalData, type);
        tableContainer.parentNode.insertBefore(resetBtn, tableContainer);
    }
}

// 重置搜索结果
function resetSearchResults(originalData, type) {
    // 恢复原始数据
    switch (type) {
        case 'inbound':
            InventoryDB.inboundRecords = originalData.inbound;
            break;
        case 'outbound':
            InventoryDB.outboundRecords = originalData.outbound;
            break;
        case 'transfer':
            InventoryDB.transferRecords = originalData.transfer;
            break;
    }
    
    // 重新加载表格
    loadTableData(`${type}TableBody`);
    
    // 移除重置按钮
    const resetBtn = document.querySelector('.reset-search-btn');
    if (resetBtn) {
        resetBtn.remove();
    }
}

// 重置高级搜索表单
function resetAdvancedSearch(type) {
    document.getElementById('advancedSearchForm').reset();
}

// 供需对应功能
const SupplyDemandManager = {
    // 数据存储（从API获取的数据）
    apiData: {
        demands: [],
        supplies: []
    },
    // 分页配置
    pagination: {
        demand: { currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 },
        supply: { currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 }
    },
    /** 发布弹窗中已上传附件（提交时写入 JSON，对应 OSS bucket zhili-kids-industry-system / fujian/） */
    pendingDemandAttachments: [],
    pendingSupplyAttachments: [],

    // ========== WebSocket 实时通知 ==========
    wsClient: null,
    wsConnected: false,
    unreadCount: 0,

    /** 初始化 WebSocket 连接（订阅供需对接通知） */
    initWebSocket: function() {
        const token = localStorage.getItem('token');
        const userInfoRaw = localStorage.getItem('userInfo');
        if (!token || !userInfoRaw) {
            console.log('【供需对接】未登录，跳过 WebSocket 初始化');
            return;
        }

        let userId;
        try {
            const u = JSON.parse(userInfoRaw);
            userId = u.id;
        } catch (e) {
            console.error('【供需对接】用户信息解析失败', e);
            return;
        }

        // 已有连接则跳过
        if (this.wsClient && this.wsConnected) {
            return;
        }

        // 动态加载 SockJS 和 STOMP
        this._loadStompLibs().then(() => {
            this._connectStomp(token, userId);
        }).catch(err => {
            console.error('【供需对接】加载 STOMP 库失败', err);
        });
    },

    /** 动态加载 SockJS 和 STOMP.js */
    _loadStompLibs: function() {
        return new Promise((resolve, reject) => {
            if (typeof Stomp !== 'undefined') {
                resolve();
                return;
            }

            let sockJsLoaded = typeof SockJS !== 'undefined';
            let stompLoaded = false;

            const checkReady = () => {
                if (sockJsLoaded && stompLoaded) {
                    resolve();
                }
            };

            // 加载 SockJS
            if (!sockJsLoaded) {
                const sockJs = document.createElement('script');
                sockJs.src = 'https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js';
                sockJs.onload = () => {
                    sockJsLoaded = true;
                    checkReady();
                };
                sockJs.onerror = () => reject(new Error('SockJS 加载失败'));
                document.head.appendChild(sockJs);
            } else {
                checkReady();
            }

            // 加载 STOMP
            const stomp = document.createElement('script');
            stomp.src = 'https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js';
            stomp.onload = () => {
                stompLoaded = true;
                checkReady();
            };
            stomp.onerror = () => reject(new Error('STOMP 加载失败'));
            document.head.appendChild(stomp);
        });
    },

    /** 连接 STOMP WebSocket */
    _connectStomp: function(token, userId) {
        try {
            const socket = SockJS('/ws');
            this.wsClient = Stomp.over(socket);

            // 关闭默认日志
            this.wsClient.debug = function() {};

            const self = this;
            this.wsClient.connect(
                { 'token': token },
                function(frame) {
                    console.log('【供需对接】WebSocket 连接成功');
                    self.wsConnected = true;

                    // 订阅个人通知频道
                    self.wsClient.subscribe('/topic/connection/user/' + userId, function(message) {
                        self._handleNotification(JSON.parse(message.body));
                    });

                    // 订阅全局广播频道（可选）
                    self.wsClient.subscribe('/topic/connection/all', function(message) {
                        self._handleNotification(JSON.parse(message.body));
                    });
                },
                function(error) {
                    console.error('【供需对接】WebSocket 连接错误', error);
                    self.wsConnected = false;
                    // 5秒后重连
                    setTimeout(() => self._connectStomp(token, userId), 5000);
                }
            );

            // 连接关闭时重连
            socket.onclose = function() {
                console.log('【供需对接】WebSocket 连接关闭');
                self.wsConnected = false;
                setTimeout(() => self._connectStomp(token, userId), 5000);
            };

        } catch (e) {
            console.error('【供需对接】STOMP 连接失败', e);
        }
    },

    /** 处理收到的通知 */
    _handleNotification: function(notif) {
        console.log('【供需对接】收到实时通知:', notif);

        if (notif.type === 'new_connection') {
            // 新对接申请
            this._handleNewConnection(notif);
        } else if (notif.type === 'status_changed') {
            // 状态变更（包含撤销）
            this._handleStatusChanged(notif);
        }

        // 更新未读数
        this._incrementUnreadCount();
    },

    /** 处理新对接申请通知 */
    _handleNewConnection: function(notif) {
        // 刷新消息列表（如果已打开）
        var msgModal = document.querySelector('.msg-modal');
        if (msgModal) {
            this.showMyPublishedItems();
        }

        // 显示通知提示
        var msg = '收到新的对接申请！';
        if (notif.applicantCompanyName) {
            msg = '「' + notif.applicantCompanyName + '」向您发起了对接申请';
        }
        if (notif.connectionNo) {
            msg += ' (#' + notif.connectionNo + ')';
        }
        this._showRealTimeTip(msg, 'success');
    },

    /** 处理状态变更通知 */
    _handleStatusChanged: function(notif) {
        // 刷新消息列表
        var msgModal = document.querySelector('.msg-modal');
        if (msgModal) {
            this.showMyPublishedItems();
        }

        // 显示通知提示
        var msg = '对接状态已更新';
        if (notif.connectionNo) {
            msg = '对接 #' + notif.connectionNo + ' ';
            if (notif.statusText) {
                msg += '已变更为「' + notif.statusText + '」';
            }
        }
        this._showRealTimeTip(msg, 'info');
    },

    /** 显示实时提示 */
    _showRealTimeTip: function(message, type) {
        // 移除旧的提示
        var existingTip = document.querySelector('.supply-connection-tip');
        if (existingTip) { existingTip.remove(); }

        var tip = document.createElement('div');
        tip.className = 'supply-connection-tip tip-' + type;
        tip.innerHTML = '<i class="bi bi-bell-fill"></i><span>' + message + '</span>';
        document.body.appendChild(tip);

        // 淡入
        setTimeout(() => tip.classList.add('show'), 10);

        // 3秒后淡出
        setTimeout(() => {
            tip.classList.remove('show');
            setTimeout(() => tip.remove(), 300);
        }, 3000);
    },

    /** 增加未读数 */
    _incrementUnreadCount: function() {
        this.unreadCount++;
        this._updateUnreadBadge();
    },

    /** 更新未读角标 */
    _updateUnreadBadge: function() {
        var badge = document.getElementById('supplyUnreadBadge');
        if (!badge) {
            // 如果没有 badge，创建它（通常在消息按钮旁边）
            badge = document.createElement('span');
            badge.id = 'supplyUnreadBadge';
            badge.className = 'unread-badge';
            var msgBtn = document.querySelector('[onclick*="showMyPublishedItems"]');
            if (msgBtn && msgBtn.parentNode) {
                msgBtn.parentNode.style.position = 'relative';
                msgBtn.parentNode.appendChild(badge);
            }
        }

        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    },

    /** 重置未读数（查看消息后调用） */
    resetUnreadCount: function() {
        this.unreadCount = 0;
        this._updateUnreadBadge();
    },

    // ========== 原有方法保持不变 ==========
    getPublishUserContext: function() {
        try {
            const raw = localStorage.getItem('userInfo');
            if (!raw) {
                return { contactName: '', email: '', companyName: '', location: '浙江省湖州市' };
            }
            const u = JSON.parse(raw);
            const email = (u.enterpriseContactEmail || u.email || '').trim();
            const loc = (u.enterpriseAddress && String(u.enterpriseAddress).trim()) ? String(u.enterpriseAddress).trim() : '浙江省湖州市';
            return {
                contactName: (u.nickname || u.username || '').trim() || '联系人',
                email: email,
                companyName: (u.enterpriseName || '').trim(),
                location: loc
            };
        } catch (e) {
            return { contactName: '', email: '', companyName: '', location: '浙江省湖州市' };
        }
    },

    /**
     * 发布供需仅允许：已登录 + 企业用户 + 企业审核通过（与后端一致）
     */
    assertEnterprisePublishAllowed: function() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录后再发布');
            return false;
        }
        const raw = localStorage.getItem('userInfo');
        if (!raw) {
            alert('请先登录后再发布');
            return false;
        }
        let u;
        try {
            u = JSON.parse(raw);
        } catch (e) {
            alert('用户信息异常，请重新登录');
            return false;
        }
        if (u.userType !== 2) {
            alert('仅企业用户可发布需求或供应信息，请使用企业账号登录。');
            return false;
        }
        if (u.enterpriseStatus !== 1) {
            if (u.enterpriseStatus === 0) {
                alert('您的企业账号正在审核中，审核通过后方可发布。');
            } else {
                alert('您的企业账号尚未通过审核，暂无法发布。');
            }
            return false;
        }
        return true;
    },

    /** 打开发布弹窗后，预填企业与联系人（可编辑） */
    fillPublishFormFromUser: function(prefix) {
        const ctx = this.getPublishUserContext();
        let enterprisePhone = '';
        try {
            const raw = localStorage.getItem('userInfo');
            if (raw) {
                const u = JSON.parse(raw);
                enterprisePhone = (u.enterprisePhone && String(u.enterprisePhone).trim()) ? String(u.enterprisePhone).trim() : '';
            }
        } catch (e) { /* ignore */ }
        const map = prefix === 'demand'
            ? [
                ['demandCompanyName', ctx.companyName],
                ['demandContactName', ctx.contactName],
                ['demandEmail', ctx.email],
                ['demandLocation', ctx.location],
                ['demandPhone', enterprisePhone]
            ]
            : [
                ['supplyCompanyName', ctx.companyName],
                ['supplyContactName', ctx.contactName],
                ['supplyEmail', ctx.email],
                ['supplyLocation', ctx.location],
                ['supplyPhone', enterprisePhone]
            ];
        map.forEach(function(pair) {
            const el = document.getElementById(pair[0]);
            if (el && pair[1]) el.value = pair[1];
        });
    },
    
    // 从API加载需求数据
    loadDemandsFromAPI: async function() {
        const cardList = document.querySelector('.card-list');
        if (!cardList) {
            console.warn('未找到.card-list元素，可能不在供需对接标签页');
            return;
        }
        
        cardList.innerHTML = '<div class="empty-state">正在加载数据...</div>';
        
        try {
            // 添加超时控制（10秒）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${API_BASE_URL}/supply/demands`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.code === 200 && result.data) {
                this.apiData.demands = Array.isArray(result.data) ? result.data.map(item => this.mapDemandFromAPI(item)) : [];
                var demandTotal = result.total || result.totalRecords || this.apiData.demands.length;
                this.pagination.demand.totalRecords = demandTotal;
                this.pagination.demand.totalPages = Math.ceil(demandTotal / this.pagination.demand.pageSize) || 1;
                this.pagination.demand.currentPage = 1;
                this.updateSupplyDemandList('demand');
            } else {
                console.error('加载需求数据失败:', result.msg || result.message);
                this.showError('加载需求数据失败: ' + (result.msg || '未知错误'));
            }
        } catch (error) {
            console.error('加载需求数据出错:', error);
            if (error.name === 'AbortError') {
                this.showError('请求超时，请检查网络连接或后端服务状态');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showError('无法连接到服务器，请确保后端服务已启动 (http://localhost:8080)');
            } else {
                this.showError('网络错误: ' + error.message);
            }
        }
    },
    
    // 从API加载供应数据
    loadSuppliesFromAPI: async function() {
        const cardList = document.querySelector('.card-list');
        if (!cardList) {
            console.warn('未找到.card-list元素，可能不在供需对接标签页');
            return;
        }
        
        cardList.innerHTML = '<div class="empty-state">正在加载数据...</div>';
        
        try {
            // 添加超时控制（10秒）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${API_BASE_URL}/supply/supplies`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.code === 200 && result.data) {
                this.apiData.supplies = result.data.map(item => this.mapSupplyFromAPI(item));
                this.pagination.supply.totalRecords = result.data.length;
                this.pagination.supply.totalPages = Math.ceil(result.data.length / this.pagination.supply.pageSize);
                this.pagination.supply.currentPage = 1;
                this.updateSupplyDemandList('supply');
            } else {
                console.error('加载供应数据失败:', result.msg || result.message);
                this.showError('加载供应数据失败: ' + (result.msg || '未知错误'));
            }
        } catch (error) {
            console.error('加载供应数据出错:', error);
            if (error.name === 'AbortError') {
                this.showError('请求超时，请检查网络连接或后端服务状态');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showError('无法连接到服务器，请确保后端服务已启动 (http://localhost:8080)');
            } else {
                this.showError('网络错误: ' + error.message);
            }
        }
    },
    
    // 从API搜索需求数据
    searchDemandsFromAPI: async function(filters) {
        try {
            const params = new URLSearchParams();
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.type) params.append('type', filters.type);
            if (filters.urgency) params.append('urgency', filters.urgency);
            if (filters.status) params.append('status', filters.status);
            
            const response = await fetch(`${API_BASE_URL}/supply/demands/search?${params.toString()}`);
            const result = await response.json();
            if (result.code === 200 && result.data) {
                this.apiData.demands = Array.isArray(result.data) ? result.data.map(item => this.mapDemandFromAPI(item)) : [];
                var demandTotal = result.total || result.totalRecords || this.apiData.demands.length;
                this.pagination.demand.totalRecords = demandTotal;
                this.pagination.demand.totalPages = Math.ceil(demandTotal / this.pagination.demand.pageSize) || 1;
                this.pagination.demand.currentPage = 1;
                this.updateSupplyDemandList('demand');
            } else {
                console.error('搜索需求数据失败:', result.msg);
                this.showError('搜索失败');
            }
        } catch (error) {
            console.error('搜索需求数据出错:', error);
            this.showError('网络错误，无法搜索数据');
        }
    },
    
    // 从API搜索供应数据
    searchSuppliesFromAPI: async function(filters) {
        try {
            const params = new URLSearchParams();
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);
            
            const response = await fetch(`${API_BASE_URL}/supply/supplies/search?${params.toString()}`);
            const result = await response.json();
            if (result.code === 200 && result.data) {
                this.apiData.supplies = result.data.map(item => this.mapSupplyFromAPI(item));
                this.pagination.supply.totalRecords = result.data.length;
                this.pagination.supply.totalPages = Math.ceil(result.data.length / this.pagination.supply.pageSize);
                this.pagination.supply.currentPage = 1;
                this.updateSupplyDemandList('supply');
            } else {
                console.error('搜索供应数据失败:', result.msg);
                this.showError('搜索失败');
            }
        } catch (error) {
            console.error('搜索供应数据出错:', error);
            this.showError('网络错误，无法搜索数据');
        }
    },
    
    // 将API返回的需求数据映射为前端格式
    mapDemandFromAPI: function(apiItem) {
        const tags = apiItem.tags ? apiItem.tags.split(',').map(t => t.trim()) : [];
        const specifications = apiItem.specifications ? JSON.parse(apiItem.specifications) : {};
        const requirements = apiItem.requirements ? apiItem.requirements.split('\n').filter(r => r.trim()) : [];
        
        return {
            id: apiItem.id,                        // 数字ID（API提交用）
            demandId: apiItem.demandId,            // 字符串编号（显示用）
            title: apiItem.title,
            type: apiItem.type,
            category: apiItem.category,
            urgency: apiItem.urgency,
            status: apiItem.status,
            userId: apiItem.userId,               // 发布者用户ID（判断是否自己）
            company: apiItem.companyName,
            contact: apiItem.contactName,
            phone: apiItem.contactPhone,
            email: apiItem.email,
            description: apiItem.description,
            specifications: specifications,
            budget: apiItem.budget || '面议',
            deadline: apiItem.deadline || '长期有效',
            publishDate: apiItem.publishDate || apiItem.publish_date,
            tags: tags,
            location: apiItem.location,
            requirements: requirements,
            attachments: apiItem.attachments || []
        };
    },
    
    // 将API返回的供应数据映射为前端格式
    mapSupplyFromAPI: function(apiItem) {
        const tags = apiItem.tags ? apiItem.tags.split(',').map(t => t.trim()) : [];
        const specifications = apiItem.specifications ? JSON.parse(apiItem.specifications) : {};
        const advantages = apiItem.advantages ? apiItem.advantages.split('\n').filter(a => a.trim()) : [];
        const certifications = apiItem.certifications ? apiItem.certifications.split(',').map(c => c.trim()) : [];
        
        return {
            id: apiItem.id,                        // 数字ID（API提交用）
            supplyId: apiItem.supplyId,            // 字符串编号（显示用）
            title: apiItem.title,
            type: apiItem.type,
            category: apiItem.category,
            status: apiItem.status,
            userId: apiItem.userId,               // 发布者用户ID（判断是否自己）
            company: apiItem.companyName,
            contact: apiItem.contactName,
            phone: apiItem.contactPhone,
            email: apiItem.email,
            description: apiItem.description,
            specifications: specifications,
            price: apiItem.price || '面议',
            capacity: apiItem.capacity || '请联系了解',
            publishDate: apiItem.publishDate || apiItem.publish_date,
            tags: tags,
            location: apiItem.location,
            advantages: advantages,
            certifications: certifications,
            attachments: apiItem.attachments || []
        };
    },
    
    // 显示错误提示
    showError: function(message) {
        const cardList = document.querySelector('.card-list');
        if (cardList) {
            cardList.innerHTML = `
                <div class="empty-state" style="color: #f44336; padding: 40px; text-align: center;">
                    <i class="bi bi-exclamation-triangle" style="font-size: 48px; color: #f44336; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px; margin-bottom: 8px;">${message}</p>
                    <p style="font-size: 14px; color: #666;">请检查：</p>
                    <ul style="text-align: left; display: inline-block; margin-top: 8px; color: #666;">
                        <li>后端服务是否已启动 (http://localhost:8080)</li>
                        <li>数据库是否已初始化</li>
                        <li>网络连接是否正常</li>
                    </ul>
                </div>
            `;
        }
    },
    // 查看需求详情（从API获取）
    viewDemandDetail: async function(demandId) {
        try {
            // 先从本地数据查找
            let demand = this.apiData.demands.find(d => d.id === demandId);
            
            // 如果本地没有，从API获取详情
            if (!demand) {
                const response = await fetch(`${API_BASE_URL}/supply/demands/${demandId}`);
                const result = await response.json();
                if (result.code === 200 && result.data) {
                    demand = this.mapDemandFromAPI(result.data);
                } else {
                    alert('未找到该需求信息');
                    return;
                }
            }
            
            this.showDetailModal(demand, 'demand');
        } catch (error) {
            console.error('获取需求详情出错:', error);
            alert('获取需求详情失败');
        }
    },
    
    // 查看供应详情（从API获取）
    viewSupplyDetail: async function(supplyId) {
        try {
            // 先从本地数据查找
            let supply = this.apiData.supplies.find(s => s.id === supplyId);
            
            // 如果本地没有，从API获取详情
            if (!supply) {
                const response = await fetch(`${API_BASE_URL}/supply/supplies/${supplyId}`);
                const result = await response.json();
                if (result.code === 200 && result.data) {
                    supply = this.mapSupplyFromAPI(result.data);
                } else {
                    alert('未找到该供应信息');
                    return;
                }
            }
            
            this.showDetailModal(supply, 'supply');
        } catch (error) {
            console.error('获取供应详情出错:', error);
            alert('获取供应详情失败');
        }
    },
    
    // 显示详情模态框
    showDetailModal: function(data, type) {
        var self = this;
        var showDockingBtn = false;
        var currentUserId = null;

        // 判断是否显示对接按钮：需已登录 + 企业用户 + 审核通过 + 非自己发布
        try {
            var token = localStorage.getItem('token');
            var userInfoRaw = localStorage.getItem('userInfo');
            if (token && userInfoRaw) {
                var u = JSON.parse(userInfoRaw);
                if (u.userType === 2 && u.enterpriseStatus === 1) {
                    currentUserId = u.id;
                    // 非自己发布
                    if (data.userId && u.id !== data.userId) {
                        showDockingBtn = true;
                    }
                }
            }
        } catch (e) { /* ignore */ }

        var modal = document.createElement('div');
        modal.className = 'inventory-modal show supply-demand-modal';
        var btnHtml = '';
        if (showDockingBtn) {
            if (type === 'demand') {
                btnHtml = `<button class="btn-primary" onclick="SupplyDemandManager.initiateConnection('${data.id}', 'demand')">
                    <i class="bi bi-handshake"></i> 我要对接
                </button>`;
            } else {
                btnHtml = `<button class="btn-primary" onclick="SupplyDemandManager.initiateConnection('${data.id}', 'supply')">
                    <i class="bi bi-handshake"></i> 申请合作
                </button>`;
            }
        }
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${type === 'demand' ? '需求详情' : '供应详情'}</h3>
                    <span class="modal-close" onclick="this.closest('.inventory-modal').remove(); document.body.style.overflow = 'auto'">&times;</span>
                </div>
                <div class="modal-body">
                    ${this.generateDetailHTML(data, type)}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.inventory-modal').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-x-circle"></i> 关闭
                    </button>
                    ${btnHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // 生成详情HTML
    generateDetailHTML: function(data, type) {
        const urgencyText = this.getUrgencyText(data.urgency);
        const statusText = this.getStatusText(data.status, type);
        
        let html = `
            <div class="detail-container">
                <div class="detail-header">
                    <div class="detail-title">
                        <h2>${data.title}</h2>
                        <div class="detail-badges">
                            <span class="badge badge-${data.type}">${data.category}</span>
                            ${data.urgency ? `<span class="badge badge-urgency-${data.urgency}">${urgencyText}</span>` : ''}
                            <span class="badge badge-status-${data.status}">${statusText}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-content">
                    <div class="detail-section">
                        <h4><i class="bi bi-building"></i> 企业信息</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>企业名称:</label>
                                <span>${data.company}</span>
                            </div>
                            <div class="info-item">
                                <label>联系人:</label>
                                <span>${data.contact}</span>
                            </div>
                            <div class="info-item">
                                <label>联系电话:</label>
                                <span>${data.phone}</span>
                            </div>
                            <div class="info-item">
                                <label>邮箱:</label>
                                <span>${data.email}</span>
                            </div>
                            <div class="info-item">
                                <label>所在地区:</label>
                                <span>${data.location}</span>
                            </div>
                            <div class="info-item">
                                <label>发布时间:</label>
                                <span>${data.publishDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-file-text"></i> ${type === 'demand' ? '需求' : '供应'}描述</h4>
                        <div class="description-content">
                            <p>${data.description}</p>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-gear"></i> 规格要求</h4>
                        <div class="specifications-content">
                            ${this.generateSpecificationsHTML(data.specifications, type)}
                        </div>
                    </div>
                    
                    ${type === 'demand' ? `
                    <div class="detail-section">
                        <h4><i class="bi bi-currency-dollar"></i> 预算范围</h4>
                        <div class="budget-content">
                            <span class="budget-amount">${data.budget}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-calendar-check"></i> 截止日期</h4>
                        <div class="deadline-content">
                            <span class="deadline-date">${data.deadline}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-list-check"></i> 具体要求</h4>
                        <div class="requirements-content">
                            <ul>
                                ${data.requirements.map(req => `<li>${req}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    ` : `
                    <div class="detail-section">
                        <h4><i class="bi bi-currency-dollar"></i> 价格信息</h4>
                        <div class="price-content">
                            <span class="price-amount">${data.price}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-speedometer2"></i> 产能信息</h4>
                        <div class="capacity-content">
                            <span class="capacity-info">${data.capacity}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-star"></i> 优势特点</h4>
                        <div class="advantages-content">
                            <ul>
                                ${data.advantages.map(adv => `<li>${adv}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-award"></i> 认证资质</h4>
                        <div class="certifications-content">
                            ${data.certifications.map(cert => `<span class="cert-badge">${cert}</span>`).join('')}
                        </div>
                    </div>
                    `}
                    
                    <div class="detail-section">
                        <h4><i class="bi bi-tags"></i> 标签</h4>
                        <div class="tags-content">
                            ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    
                    ${data.attachments && data.attachments.length > 0 ? `
                    <div class="detail-section">
                        <h4><i class="bi bi-paperclip"></i> 附件文档</h4>
                        <div class="attachments-content">
                            ${data.attachments.map(att => {
                                const fileName = att.fileName || att.name || '附件';
                                const fileSize = att.fileSize || att.size || '-';
                                const fileUrl = att.fileUrl || att.url || '';
                                // JSON.stringify(undefined) 会得到 undefined，插进 onclick 会变成 downloadAttachment(,...) 导致整页脚本语法错误
                                const idArg = JSON.stringify(att.id != null ? att.id : null);
                                const safeName = String(fileName).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                const safeSize = String(fileSize).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                return `
                                <div class="attachment-item">
                                    <i class="bi bi-file-earmark"></i>
                                    <span class="attachment-name">${safeName}</span>
                                    <span class="attachment-size">(${safeSize})</span>
                                    <button type="button" class="btn-small" onclick="SupplyDemandManager.downloadAttachment(${idArg}, ${JSON.stringify(fileName)}, ${JSON.stringify(fileUrl)})">下载</button>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        return html;
    },
    
    // 生成规格HTML
    generateSpecificationsHTML: function(specs, type) {
        let html = '<div class="specs-grid">';
        
        for (const [key, value] of Object.entries(specs)) {
            const label = this.getSpecLabel(key);
            const displayValue = Array.isArray(value) ? value.join(', ') : value;
            
            html += `
                <div class="spec-item">
                    <label>${label}:</label>
                    <span>${displayValue}</span>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    },
    
    // 获取规格标签
    getSpecLabel: function(key) {
        const labels = {
            material: '材质',
            count: '支数',
            width: '幅宽',
            colors: '颜色',
            quantity: '数量',
            usage: '用途',
            printType: '印花类型',
            fabric: '面料',
            size: '尺码',
            ageGroup: '年龄段',
            season: '季节',
            style: '风格',
            theme: '主题',
            gender: '性别',
            materials: '材质',
            sizes: '规格',
            packaging: '包装',
            coverage: '覆盖范围',
            serviceType: '服务类型',
            timeLimit: '时效',
            tracking: '追踪',
            weight: '克重',
            minOrder: '起订量',
            printTypes: '印花类型',
            fabrics: '适用面料',
            maxSize: '最大尺寸',
            ageRange: '年龄范围',
            styles: '风格类型',
            services: '服务内容',
            deliverables: '交付物',
            timeline: '周期'
        };
        
        return labels[key] || key;
    },
    
    // 获取紧急程度文本
    getUrgencyText: function(urgency) {
        const urgencyMap = {
            'high': '紧急',
            'medium': '一般',
            'low': '不急'
        };
        return urgencyMap[urgency] || urgency;
    },
    
    // 获取状态文本
    getStatusText: function(status, type) {
        if (type === 'demand') {
            const statusMap = {
                'open': '未对接',
                'inprocess': '对接中',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            return statusMap[status] || status;
        } else {
            const statusMap = {
                'available': '可供应',
                'busy': '产能紧张',
                'unavailable': '暂不可用'
            };
            return statusMap[status] || status;
        }
    },
    
    // 发起对接
    initiateConnection: function(id, type) {
        // 权限校验：企业用户且审核通过
        if (!this.assertEnterprisePublishAllowed()) return;

        const modal = document.createElement('div');
        modal.className = 'inventory-modal show';
        modal.innerHTML = `
            <div class="modal-content connection-modal">
                <div class="modal-header">
                    <div class="header-content">
                        <div class="custom-avatar">
                            <div class="avatar-circle">
                                <div class="avatar-face">
                                    <div class="avatar-eyes">
                                        <div class="eye left-eye"></div>
                                        <div class="eye right-eye"></div>
                                    </div>
                                    <div class="avatar-smile"></div>
                                </div>
                                <div class="avatar-handshake">
                                    <i class="bi bi-handshake"></i>
                                </div>
                            </div>
                        </div>
                        <div class="header-text">
                            <h3>发起对接</h3>
                            <p>请填写您的联系信息，我们将尽快为您安排对接</p>
                        </div>
                    </div>
                    <span class="modal-close" onclick="this.closest('.inventory-modal').remove(); document.body.style.overflow = 'auto'">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="connectionForm" class="connection-form">
                        <div class="form-section">
                            <div class="section-title">
                                <i class="bi bi-building"></i>
                                <span>企业信息</span>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label><i class="bi bi-building"></i> 企业名称 *</label>
                                    <input type="text" id="companyName" placeholder="请输入您的企业名称" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <div class="section-title">
                                <i class="bi bi-person-circle"></i>
                                <span>联系信息</span>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label><i class="bi bi-person"></i> 联系人 *</label>
                                    <input type="text" id="contactName" placeholder="请输入联系人姓名" required>
                                </div>
                                <div class="form-group">
                                    <label><i class="bi bi-telephone"></i> 联系电话 *</label>
                                    <input type="tel" id="contactPhone" placeholder="请输入联系电话" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label><i class="bi bi-envelope"></i> 邮箱地址 *</label>
                                    <input type="email" id="contactEmail" placeholder="请输入邮箱地址" required>
                                </div>
                                <div class="form-group">
                                    <label><i class="bi bi-geo-alt"></i> 所在地区</label>
                                    <select id="contactRegion">
                                        <option value="">请选择地区</option>
                                        <option value="湖州市">湖州市</option>
                                        <option value="杭州市">杭州市</option>
                                        <option value="嘉兴市">嘉兴市</option>
                                        <option value="绍兴市">绍兴市</option>
                                        <option value="其他">其他地区</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <div class="section-title">
                                <i class="bi bi-chat-dots"></i>
                                <span>合作意向</span>
                            </div>
                            <div class="form-group">
                                <label><i class="bi bi-card-text"></i> 对接说明</label>
                                <textarea id="connectionNote" rows="4" placeholder="请详细说明您的合作意向、具体需求、预期合作方式等...&#10;例如：我们是一家专业的童装生产企业，希望与贵公司建立长期合作关系..."></textarea>
                            </div>
                            <div class="form-group">
                                <label><i class="bi bi-clock"></i> 期望回复时间</label>
                                <select id="expectedReply">
                                    <option value="asap">尽快回复</option>
                                    <option value="1day">1个工作日内</option>
                                    <option value="3days">3个工作日内</option>
                                    <option value="1week">1周内</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-tips">
                            <div class="tips-header">
                                <i class="bi bi-lightbulb"></i>
                                <span>温馨提示</span>
                            </div>
                            <ul>
                                <li>请确保联系信息准确无误，以便我们及时与您联系</li>
                                <li>详细的合作说明有助于提高对接成功率</li>
                                <li>我们承诺保护您的商业信息安全</li>
                            </ul>
                        </div>
                        
                        <div class="submit-action">
                            <button type="button" class="btn-submit-connection" id="connectionSubmitBtn" onclick="SupplyDemandManager.submitConnection('${id}', '${type}')">
                                <div class="btn-icon">
                                    <i class="bi bi-send"></i>
                                </div>
                                <div class="btn-text">
                                    <span class="btn-title">发送对接申请</span>
                                    <span class="btn-subtitle">点击提交您的合作申请</span>
                                </div>
                                <div class="btn-arrow">
                                    <i class="bi bi-arrow-right"></i>
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.inventory-modal').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-x-circle"></i> 取消
                    </button>
                    <button class="btn-primary" id="connectionSubmitBtnAlt" onclick="SupplyDemandManager.submitConnection('${id}', '${type}')">
                        <i class="bi bi-send"></i> 提交对接申请
                    </button>
                </div>
            </div>
        `;
        
        // 关闭当前详情模态框
        const currentModal = document.querySelector('.supply-demand-modal');
        if (currentModal) {
            currentModal.remove();
        }
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // 预填表单：从 localStorage 读取用户信息
        this._fillConnectionForm();
    },

    /** 预填对接表单 */
    _fillConnectionForm: function() {
        try {
            const raw = localStorage.getItem('userInfo');
            if (!raw) return;
            const u = JSON.parse(raw);
            if (u.enterpriseName) {
                const el = document.getElementById('companyName');
                if (el) el.value = String(u.enterpriseName).trim();
            }
            if (u.nickname || u.username) {
                const el = document.getElementById('contactName');
                if (el) el.value = (u.nickname || u.username || '').trim();
            }
            if (u.enterprisePhone) {
                const el = document.getElementById('contactPhone');
                if (el) el.value = String(u.enterprisePhone).trim();
            }
            if (u.enterpriseContactEmail || u.email) {
                const el = document.getElementById('contactEmail');
                if (el) el.value = (u.enterpriseContactEmail || u.email || '').trim();
            }
        } catch (e) { /* ignore */ }
    },
    
    // 提交对接申请
    submitConnection: async function(id, type) {
        if (!this.assertEnterprisePublishAllowed()) return;

        // 验证表单
        const companyName = document.getElementById('companyName').value.trim();
        const contactName = document.getElementById('contactName').value.trim();
        const contactPhone = document.getElementById('contactPhone').value.trim();
        const contactEmail = document.getElementById('contactEmail').value.trim();

        if (!companyName || !contactName || !contactPhone || !contactEmail) {
            this.showValidationError('请填写所有必填项（标有*的字段）');
            return;
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            this.showValidationError('请输入正确的邮箱地址');
            return;
        }

        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(contactPhone)) {
            this.showValidationError('请输入正确的手机号码（11位手机号）');
            return;
        }

        // 显示提交中状态
        var submitBtn = document.getElementById('connectionSubmitBtn');
        var submitBtnAlt = document.getElementById('connectionSubmitBtnAlt');
        var self = this;

        var setLoading = function(btn, isLoading) {
            if (!btn) return;
            btn.disabled = true;
            if (btn.classList.contains('btn-submit-connection')) {
                btn.innerHTML = '<div class="btn-icon"><i class="bi bi-hourglass-split"></i></div>' +
                    '<div class="btn-text"><span class="btn-title">' + (isLoading ? '提交中...' : '发送对接申请') + '</span>' +
                    '<span class="btn-subtitle">' + (isLoading ? '正在处理您的申请' : '点击提交您的合作申请') + '</span></div>' +
                    '<div class="btn-arrow"><i class="bi bi-arrow-right"></i></div>';
            } else {
                btn.innerHTML = '<i class="bi bi-hourglass-split"></i> ' + (isLoading ? '提交中...' : '提交对接申请');
            }
        };

        setLoading(submitBtn, true);
        setLoading(submitBtnAlt, true);

        var token = localStorage.getItem('token');
        if (!token) {
            this.showValidationError('登录已失效，请重新登录');
            setLoading(submitBtn, false);
            setLoading(submitBtnAlt, false);
            return;
        }

        // 构建后端请求数据
        var requestData = {
            demandId: type === 'demand' ? parseInt(id, 10) : null,
            supplyId: type === 'supply' ? parseInt(id, 10) : null,
            notes: document.getElementById('connectionNote').value.trim() || null
        };

        try {
            var response = await fetch(API_BASE_URL + '/supply/connections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestData)
            });

            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            if (result.code === 200) {
                // 关闭模态框
                var modal = document.querySelector('.inventory-modal');
                if (modal) modal.remove();
                document.body.style.overflow = 'auto';

                // 刷新列表（重新从API加载）
                if (type === 'demand') {
                    await this.loadDemandsFromAPI();
                } else {
                    await this.loadSuppliesFromAPI();
                }
                this.updateSupplyDemandList(type);

                alert('对接申请提交成功！');
            } else if (response.status === 401) {
                this.showValidationError('登录已失效或无权访问，请重新登录');
            } else {
                this.showValidationError('提交失败：' + (result.message || result.msg || '未知错误'));
            }
        } catch (error) {
            console.error('提交对接申请出错:', error);
            this.showValidationError('提交失败，请检查网络连接');
        } finally {
            setLoading(submitBtn, false);
            setLoading(submitBtnAlt, false);
        }
    },
    
    // 显示验证错误
    showValidationError: function(message) {
        // 移除之前的错误提示
        const existingError = document.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // 创建错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="bi bi-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 插入到表单顶部
        const formContainer = document.querySelector('.connection-form');
        formContainer.insertBefore(errorDiv, formContainer.firstChild);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    },
    
    // 显示成功消息
    showSuccessMessage: function(data) {
        const modal = document.createElement('div');
        modal.className = 'inventory-modal show';
        modal.innerHTML = `
            <div class="modal-content success-modal">
                <div class="modal-header">
                    <div class="success-icon">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <h3>对接申请提交成功！</h3>
                </div>
                <div class="modal-body">
                    <div class="success-content">
                        <p class="success-message">您的对接申请已成功提交，我们已收到以下信息：</p>
                        <div class="submitted-info">
                            <div class="info-item">
                                <label>申请编号：</label>
                                <span class="highlight">${data.id}</span>
                            </div>
                            <div class="info-item">
                                <label>企业名称：</label>
                                <span>${data.companyName}</span>
                            </div>
                            <div class="info-item">
                                <label>联系人：</label>
                                <span>${data.contactName}</span>
                            </div>
                            <div class="info-item">
                                <label>期望回复：</label>
                                <span>${this.getExpectedReplyText(data.expectedReply)}</span>
                            </div>
                        </div>
                        <div class="next-steps">
                            <h4><i class="bi bi-list-check"></i> 后续流程</h4>
                            <ol>
                                <li>我们将在${this.getExpectedReplyText(data.expectedReply)}与您联系</li>
                                <li>专业对接顾问将为您安排详细沟通</li>
                                <li>确认合作意向后进入正式对接流程</li>
                            </ol>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="this.closest('.inventory-modal').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-check"></i> 我知道了
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // 获取期望回复时间文本
    getExpectedReplyText: function(value) {
        const textMap = {
            'asap': '尽快',
            '1day': '1个工作日内',
            '3days': '3个工作日内',
            '1week': '1周内'
        };
        return textMap[value] || '尽快';
    },
    
    /**
     * 下载附件：优先走后端代理 /api/supply/attachment/download/{id}（带 Content-Disposition: attachment），
     * 前端用 Blob 触发保存，避免跨域 OSS 无法触发“另存为”的问题。
     */
    downloadAttachment: async function(attachmentId, fileName, fileUrlFallback) {
        const name = (fileName && String(fileName).trim()) ? String(fileName).trim() : 'download';
        const idNum = attachmentId != null && attachmentId !== '' ? Number(attachmentId) : NaN;

        const saveBlob = (blob, fname) => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fname;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        };

        const notifyFail = (msg) => {
            if (typeof showNotification === 'function') {
                showNotification(msg, 'warning');
            } else {
                alert(msg);
            }
        };

        if (!Number.isNaN(idNum) && idNum > 0) {
            const proxyUrl = `${API_BASE_URL}/supply/attachment/download/${idNum}`;
            try {
                const resp = await fetch(proxyUrl, { method: 'GET' });
                if (!resp.ok) {
                    notifyFail('下载失败，请稍后重试');
                    return;
                }
                const blob = await resp.blob();
                saveBlob(blob, name);
                return;
            } catch (e) {
                console.error('代理下载失败:', e);
                notifyFail('无法连接后端下载服务，请确认服务已启动');
                return;
            }
        }

        if (fileUrlFallback && String(fileUrlFallback).trim()) {
            const url = String(fileUrlFallback).trim();
            try {
                const resp = await fetch(url, { method: 'GET', mode: 'cors' });
                if (resp.ok) {
                    const blob = await resp.blob();
                    saveBlob(blob, name);
                    return;
                }
            } catch (e) {
                console.warn('直连 OSS 下载失败（可能跨域）:', e);
            }
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        notifyFail('附件信息不完整，无法下载');
    },
    
    // 更新分页信息
    updatePaginationInfo: function(type) {
        const data = type === 'demand' ? this.apiData.demands : this.apiData.supplies;
        const config = this.pagination[type];
        
        config.totalRecords = data.length;
        config.totalPages = Math.ceil(data.length / config.pageSize);
        
        // 确保当前页不超出范围
        if (config.currentPage > config.totalPages) {
            config.currentPage = Math.max(1, config.totalPages);
        }
    },
    
    // 获取当前页数据
    getCurrentPageData: function(type) {
        const data = type === 'demand' ? this.apiData.demands : this.apiData.supplies;
        const config = this.pagination[type];
        
        const startIndex = (config.currentPage - 1) * config.pageSize;
        const endIndex = startIndex + config.pageSize;
        
        return data.slice(startIndex, endIndex);
    },
    
    // 跳转到指定页
    goToPage: function(type, page) {
        const config = this.pagination[type];
        if (page >= 1 && page <= config.totalPages) {
            config.currentPage = page;
            this.updateSupplyDemandList(type);
            this.updatePaginationControls(type);
        }
    },
    
    // 上一页
    previousPage: function(type) {
        const config = this.pagination[type];
        if (config.currentPage > 1) {
            this.goToPage(type, config.currentPage - 1);
        }
    },
    
    // 下一页
    nextPage: function(type) {
        const config = this.pagination[type];
        if (config.currentPage < config.totalPages) {
            this.goToPage(type, config.currentPage + 1);
        }
    },
    
    // 更新供需列表显示
    updateSupplyDemandList: function(type = 'demand') {
        const cardList = document.querySelector('.card-list');
        if (!cardList) return;
        
        // 更新分页信息
        this.updatePaginationInfo(type);
        
        // 获取当前页数据
        const pageData = this.getCurrentPageData(type);
        
        cardList.innerHTML = '';
        
        if (pageData.length === 0) {
            cardList.innerHTML = '<div class="empty-state">暂无数据</div>';
            return;
        }
        
        pageData.forEach(item => {
            const card = this.createCard(item, type);
            cardList.appendChild(card);
        });
        
        // 更新分页控制器
        this.updatePaginationControls(type);
    },
    
    // 更新分页控制器
    updatePaginationControls: function(type) {
        const config = this.pagination[type];
        const paginationContainer = document.querySelector('.pagination');
        
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = `
            <div class="pagination-controls">
                <button class="btn-page btn-prev ${config.currentPage <= 1 ? 'disabled' : ''}" 
                        onclick="SupplyDemandManager.previousPage('${type}')" 
                        ${config.currentPage <= 1 ? 'disabled' : ''}>
                    <i class="bi bi-chevron-left"></i> 上一页
                </button>
                
                <div class="page-numbers">
                    ${this.generatePageNumbers(type)}
                </div>
                
                <button class="btn-page btn-next ${config.currentPage >= config.totalPages ? 'disabled' : ''}" 
                        onclick="SupplyDemandManager.nextPage('${type}')" 
                        ${config.currentPage >= config.totalPages ? 'disabled' : ''}>
                    下一页 <i class="bi bi-chevron-right"></i>
                </button>
            </div>
            
            <div class="page-info">
                第 ${config.currentPage} 页，共 ${config.totalPages} 页 (总计 ${config.totalRecords} 条记录)
            </div>
        `;
    },
    
    // 生成页码按钮
    generatePageNumbers: function(type) {
        const config = this.pagination[type];
        let html = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, config.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(config.totalPages, startPage + maxVisiblePages - 1);
        
        // 调整起始页
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // 添加第一页和省略号
        if (startPage > 1) {
            html += `<button class="btn-page" onclick="SupplyDemandManager.goToPage('${type}', 1)">1</button>`;
            if (startPage > 2) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="btn-page ${i === config.currentPage ? 'active' : ''}" 
                     onclick="SupplyDemandManager.goToPage('${type}', ${i})">${i}</button>`;
        }
        
        // 添加最后一页和省略号
        if (endPage < config.totalPages) {
            if (endPage < config.totalPages - 1) {
                html += '<span class="page-ellipsis">...</span>';
            }
            html += `<button class="btn-page" onclick="SupplyDemandManager.goToPage('${type}', ${config.totalPages})">${config.totalPages}</button>`;
        }
        
        return html;
    },
    
    // 创建卡片
    createCard: function(data, type) {
        var card = document.createElement('div');
        card.className = type === 'demand' ? 'demand-card' : 'supply-card';

        var urgencyClass = data.urgency ? data.urgency : '';
        var urgencyText = this.getUrgencyText(data.urgency);
        var statusText = this.getStatusText(data.status, type);

        // 判断是否显示对接按钮
        var showDockingBtn = false;
        var currentUserId = null;
        try {
            var token = localStorage.getItem('token');
            var userInfoRaw = localStorage.getItem('userInfo');
            if (token && userInfoRaw) {
                var u = JSON.parse(userInfoRaw);
                if (u.userType === 2 && u.enterpriseStatus === 1) {
                    currentUserId = u.id;
                    if (data.userId && u.id !== data.userId) {
                        showDockingBtn = true;
                    }
                }
            }
        } catch (e) { /* ignore */ }

        var dockingBtnHtml = '';
        if (showDockingBtn) {
            var btnLabel = type === 'demand' ? '我要对接' : '申请合作';
            dockingBtnHtml = `<button class="btn-primary" onclick="SupplyDemandManager.initiateConnection('${data.id}', '${type}')">
                <i class="bi bi-handshake"></i> ${btnLabel}
            </button>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="card-type ${data.type}">${data.category}</span>
                <span class="card-status ${data.status}">${statusText}</span>
            </div>
            <div class="card-body">
                <h3>${data.title}</h3>
                <div class="card-info">
                    <p><strong>企业名称：</strong>${data.company}</p>
                    <p><strong>联系人：</strong>${data.contact}</p>
                    <p><strong>描述：</strong>${data.description}</p>
                    ${type === 'demand' ? 
                        `<p><strong>预算范围：</strong>${data.budget}</p>
                         <p><strong>截止日期：</strong>${data.deadline}</p>` :
                        `<p><strong>价格范围：</strong>${data.price}</p>
                         <p><strong>产能信息：</strong>${data.capacity}</p>`
                    }
                </div>
                <div class="card-tags">
                    ${Array.isArray(data.tags) ? data.tags.map(function(tag) { return '<span class="tag">' + tag + '</span>'; }).join('') : (data.tags ? data.tags.split(',').map(function(tag) { return '<span class="tag">' + tag.trim() + '</span>'; }).join('') : '')}
                </div>
            </div>
            <div class="card-footer">
                <span class="publish-time">发布时间：${data.publishDate}</span>
                <div class="card-actions">
                    <button class="btn-outline" onclick="SupplyDemandManager.${type === 'demand' ? 'viewDemandDetail' : 'viewSupplyDetail'}('${data.id}')">
                        <i class="bi bi-eye"></i> 查看详情
                    </button>
                    ${dockingBtnHtml}
                </div>
            </div>
        `;
        
        return card;
    },
    
    // 筛选功能（从API搜索）
    filterSupplyDemand: async function() {
        const type = document.querySelector('.header-tab.active').textContent === '需求信息' ? 'demand' : 'supply';
        const filters = {
            type: document.getElementById('demand-type')?.value || '',
            status: document.getElementById('demand-status')?.value || '',
            urgency: document.getElementById('demand-urgency')?.value || '',
            keyword: document.getElementById('demand-keyword')?.value || ''
        };
        
        // 从API搜索数据
        if (type === 'demand') {
            await this.searchDemandsFromAPI(filters);
        } else {
            await this.searchSuppliesFromAPI(filters);
        }
        
        // 本地筛选逻辑（如果API不支持某些筛选条件）
        let data = type === 'demand' ? this.apiData.demands : this.apiData.supplies;
        
        // 应用筛选条件
        if (filters.type) {
            data = data.filter(item => item.type === filters.type);
        }
        
        if (filters.status) {
            data = data.filter(item => item.status === filters.status);
        }
        
        if (filters.urgency && type === 'demand') {
            data = data.filter(item => item.urgency === filters.urgency);
        }
        
        if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            data = data.filter(item => 
                item.title.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword) ||
                item.company.toLowerCase().includes(keyword) ||
                item.tags.some(tag => tag.toLowerCase().includes(keyword))
            );
        }
        
        // 更新临时数据并重新渲染
        this.filteredData = data;
        this.renderFilteredData(type);
    },
    
    // 渲染筛选后的数据
    renderFilteredData: function(type) {
        const cardList = document.querySelector('.card-list');
        if (!cardList) return;
        
        const data = this.filteredData || (type === 'demand' ? this.apiData.demands : this.apiData.supplies);
        
        // 更新分页配置
        const config = this.pagination[type];
        config.totalRecords = data.length;
        config.totalPages = Math.ceil(data.length / config.pageSize);
        config.currentPage = 1; // 重置到第一页
        
        // 获取当前页数据
        const startIndex = (config.currentPage - 1) * config.pageSize;
        const endIndex = startIndex + config.pageSize;
        const pageData = data.slice(startIndex, endIndex);
        
        cardList.innerHTML = '';
        
        if (pageData.length === 0) {
            cardList.innerHTML = '<div class="empty-state"><i class="bi bi-search"></i><br>未找到匹配的结果<br><small>请尝试调整筛选条件</small></div>';
            return;
        }
        
        pageData.forEach(item => {
            const card = this.createCard(item, type);
            cardList.appendChild(card);
        });
        
        // 更新分页控制器
        this.updatePaginationControls(type);
    },
    
    // 重置筛选
    resetFilter: async function() {
        // 清空筛选表单
        const form = document.querySelector('.filter-form');
        if (form) {
            form.reset();
        }
        
        // 清除筛选数据
        this.filteredData = null;
        
        // 重新从API加载数据
        const currentType = document.querySelector('.header-tab.active').textContent === '需求信息' ? 'demand' : 'supply';
        if (currentType === 'demand') {
            await this.loadDemandsFromAPI();
        } else {
            await this.loadSuppliesFromAPI();
        }
        
        // 重新加载数据
        this.updateSupplyDemandList(currentType);
    },
    
    // 发布需求
    publishDemand: function() {
        if (!this.assertEnterprisePublishAllowed()) return;
        const modal = document.createElement('div');
        modal.className = 'publish-modal-overlay';
        modal.innerHTML = `
            <div class="publish-modal">
                <div class="publish-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon">
                            <i class="bi bi-plus-circle-fill"></i>
                        </div>
                        <div class="modal-title-text">
                            <h2>发布需求信息</h2>
                            <p>填写详细信息，让供应商更好地了解您的需求</p>
                        </div>
                    </div>
                    <button class="modal-close-btn" onclick="this.closest('.publish-modal-overlay').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="publish-modal-body">
                    <form id="publishDemandForm" class="publish-form">
                        <!-- 基本信息 -->
                        <div class="form-section">
                            <div class="section-header">
                                <i class="bi bi-info-circle"></i>
                                <h3>基本信息</h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-field full-width">
                                    <label for="demandTitle">需求标题 <span class="required">*</span></label>
                                    <input type="text" id="demandTitle" placeholder="请输入简洁明确的需求标题" required>
                                </div>
                                <div class="form-field">
                                    <label for="demandType">需求类型 <span class="required">*</span></label>
                                    <div class="select-wrapper">
                                        <select id="demandType" required>
                                            <option value="">请选择需求类型</option>
                                            <option value="material">原材料</option>
                                            <option value="processing">加工服务</option>
                                            <option value="design">设计服务</option>
                                            <option value="accessory">辅料配件</option>
                                            <option value="logistics">物流服务</option>
                                        </select>
                                        <i class="bi bi-chevron-down"></i>
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label>紧急程度 <span class="required">*</span></label>
                                    <div class="urgency-selector">
                                        <input type="radio" id="urgency-high" name="demandUrgency" value="high">
                                        <label for="urgency-high" class="urgency-option high">
                                            <i class="bi bi-exclamation-triangle-fill"></i>
                                            <span>紧急</span>
                                        </label>
                                        <input type="radio" id="urgency-medium" name="demandUrgency" value="medium" checked>
                                        <label for="urgency-medium" class="urgency-option medium">
                                            <i class="bi bi-clock-fill"></i>
                                            <span>一般</span>
                                        </label>
                                        <input type="radio" id="urgency-low" name="demandUrgency" value="low">
                                        <label for="urgency-low" class="urgency-option low">
                                            <i class="bi bi-calendar-check-fill"></i>
                                            <span>不急</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 详细信息 -->
                        <div class="form-section">
                            <div class="section-header">
                                <i class="bi bi-file-text"></i>
                                <h3>详细信息</h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-field full-width">
                                    <label for="demandDescription">需求描述 <span class="required">*</span></label>
                                    <textarea id="demandDescription" rows="4" placeholder="请详细描述您的需求，包括规格、数量、质量要求等..." required></textarea>
                                </div>
                                <div class="form-field">
                                    <label for="demandBudget">预算范围</label>
                                    <input type="text" id="demandBudget" placeholder="如：10,000-20,000元">
                                </div>
                                <div class="form-field">
                                    <label for="demandDeadline">截止日期</label>
                                    <input type="date" id="demandDeadline">
                                </div>
                            </div>
                        </div>

                        <!-- 联系信息 -->
                        <div class="form-section">
                            <div class="section-header">
                                <i class="bi bi-person-circle"></i>
                                <h3>企业与联系信息</h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-field full-width">
                                    <label for="demandCompanyName">企业名称 <span class="required">*</span></label>
                                    <input type="text" id="demandCompanyName" placeholder="与营业执照一致的企业名称" required>
                                </div>
                                <div class="form-field">
                                    <label for="demandContactName">联系人 <span class="required">*</span></label>
                                    <input type="text" id="demandContactName" placeholder="联系人姓名" required>
                                </div>
                                <div class="form-field">
                                    <label for="demandPhone">联系电话 <span class="required">*</span></label>
                                    <input type="tel" id="demandPhone" placeholder="请输入联系电话" required>
                                </div>
                                <div class="form-field">
                                    <label for="demandEmail">邮箱 <span class="required">*</span></label>
                                    <input type="email" id="demandEmail" placeholder="用于接收对接信息" required>
                                </div>
                                <div class="form-field full-width">
                                    <label for="demandLocation">所在地区</label>
                                    <input type="text" id="demandLocation" placeholder="如：浙江省湖州市">
                                </div>
                                <div class="form-field full-width">
                                    <label for="demandTags">标签</label>
                                    <input type="text" id="demandTags" placeholder="用逗号分隔，如：环保,高品质,快速交付">
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="publish-modal-footer">
                    <button class="btn-cancel" onclick="this.closest('.publish-modal-overlay').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-x-circle"></i>
                        取消
                    </button>
                    <button class="btn-publish" onclick="SupplyDemandManager.submitDemand()">
                        <i class="bi bi-send-fill"></i>
                        发布需求
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        this.fillPublishFormFromUser('demand');
        
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    },
    
    // 发布供应
    publishSupply: function() {
        if (!this.assertEnterprisePublishAllowed()) return;
        const modal = document.createElement('div');
        modal.className = 'publish-modal-overlay';
        modal.innerHTML = `
            <div class="publish-modal">
                <div class="publish-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon supply">
                            <i class="bi bi-box-seam-fill"></i>
                        </div>
                        <div class="modal-title-text">
                            <h2>发布供应信息</h2>
                            <p>展示您的供应能力，吸引更多需求方关注</p>
                        </div>
                    </div>
                    <button class="modal-close-btn" onclick="this.closest('.publish-modal-overlay').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="publish-modal-body">
                    <form id="publishSupplyForm" class="publish-form">
                        <!-- 基本信息 -->
                        <div class="form-section">
                            <div class="section-header">
                                <i class="bi bi-info-circle"></i>
                                <h3>基本信息</h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-field full-width">
                                    <label for="supplyTitle">供应标题 <span class="required">*</span></label>
                                    <input type="text" id="supplyTitle" placeholder="请输入简洁明确的供应标题" required>
                                </div>
                                <div class="form-field">
                                    <label for="supplyType">供应类型 <span class="required">*</span></label>
                                    <div class="select-wrapper">
                                        <select id="supplyType" required>
                                            <option value="">请选择供应类型</option>
                                            <option value="material">原材料</option>
                                            <option value="processing">加工服务</option>
                                            <option value="design">设计服务</option>
                                            <option value="accessory">辅料配件</option>
                                            <option value="logistics">物流服务</option>
                                        </select>
                                        <i class="bi bi-chevron-down"></i>
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label for="supplyPrice">价格范围 <span class="required">*</span></label>
                                    <input type="text" id="supplyPrice" placeholder="如：50-100元/米" required>
                                </div>
                            </div>
                        </div>

                        <!-- 详细信息 -->
                        <div class="form-section">
                            <div class="section-header">
                                <i class="bi bi-file-text"></i>
                                <h3>详细信息</h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-field full-width">
                                    <label for="supplyDescription">供应描述 <span class="required">*</span></label>
                                    <textarea id="supplyDescription" rows="4" placeholder="请详细描述您的供应能力，包括产品特点、质量标准、服务优势等..." required></textarea>
                                </div>
                                <div class="form-field">
                                    <label for="supplyCapacity">产能信息</label>
                                    <input type="text" id="supplyCapacity" placeholder="如：月产能10万米">
                                </div>
                                <div class="form-field">
                                    <label for="supplyTags">标签</label>
                                    <input type="text" id="supplyTags" placeholder="用逗号分隔，如：高品质,快速交付,定制服务">
                                </div>
                            </div>
                        </div>

                        <!-- 联系信息 -->
                        <div class="form-section">
                            <div class="section-header">
                                <i class="bi bi-person-circle"></i>
                                <h3>企业与联系信息</h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-field full-width">
                                    <label for="supplyCompanyName">企业名称 <span class="required">*</span></label>
                                    <input type="text" id="supplyCompanyName" placeholder="与营业执照一致的企业名称" required>
                                </div>
                                <div class="form-field">
                                    <label for="supplyContactName">联系人 <span class="required">*</span></label>
                                    <input type="text" id="supplyContactName" placeholder="联系人姓名" required>
                                </div>
                                <div class="form-field">
                                    <label for="supplyPhone">联系电话 <span class="required">*</span></label>
                                    <input type="tel" id="supplyPhone" placeholder="请输入联系电话" required>
                                </div>
                                <div class="form-field">
                                    <label for="supplyEmail">邮箱 <span class="required">*</span></label>
                                    <input type="email" id="supplyEmail" placeholder="用于接收对接信息" required>
                                </div>
                                <div class="form-field full-width">
                                    <label for="supplyLocation">所在地区</label>
                                    <input type="text" id="supplyLocation" placeholder="如：浙江省湖州市">
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="publish-modal-footer">
                    <button class="btn-cancel" onclick="this.closest('.publish-modal-overlay').remove(); document.body.style.overflow = 'auto'">
                        <i class="bi bi-x-circle"></i>
                        取消
                    </button>
                    <button class="btn-publish supply" onclick="SupplyDemandManager.submitSupply()">
                        <i class="bi bi-send-fill"></i>
                        发布供应
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        this.fillPublishFormFromUser('supply');
        
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    },
    
    // 提交需求
    submitDemand: async function() {
        if (!this.assertEnterprisePublishAllowed()) return;
        const title = document.getElementById('demandTitle').value.trim();
        const type = document.getElementById('demandType').value;
        const urgency = document.querySelector('input[name="demandUrgency"]:checked')?.value || 'medium';
        const description = document.getElementById('demandDescription').value.trim();
        const companyName = document.getElementById('demandCompanyName').value.trim();
        const contactName = document.getElementById('demandContactName').value.trim();
        const phone = document.getElementById('demandPhone').value.trim();
        const email = document.getElementById('demandEmail').value.trim();
        const location = (document.getElementById('demandLocation') && document.getElementById('demandLocation').value.trim()) || '浙江省湖州市';

        if (!title || !type || !description || !companyName || !contactName || !phone || !email) {
            alert('请填写所有带 * 的必填项');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }

        const deadlineEl = document.getElementById('demandDeadline');
        const deadlineVal = deadlineEl && deadlineEl.value ? deadlineEl.value : null;

        const requestData = {
            title: title,
            type: type,
            category: this.getTypeCategory(type, 'demand'),
            urgency: urgency,
            description: description,
            companyName: companyName,
            contactName: contactName,
            contactPhone: phone,
            email: email,
            location: location,
            budget: document.getElementById('demandBudget').value.trim() || null,
            deadline: deadlineVal,
            tags: document.getElementById('demandTags').value.trim() || null,
            requirements: null,
            specifications: null,
            attachments: this.pendingDemandAttachments && this.pendingDemandAttachments.length ? this.pendingDemandAttachments : []
        };

        try {
            const response = await fetch(`${API_BASE_URL}/supply/demands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json().catch(function() { return {}; });
            if (result.code === 200) {
                this.pendingDemandAttachments = [];
                const overlay = document.querySelector('.publish-modal-overlay');
                if (overlay) overlay.remove();
                document.body.style.overflow = 'auto';
                await this.loadDemandsFromAPI();
                alert('需求发布成功！');
            } else if (response.status === 401) {
                alert('登录已失效或无权访问，请重新登录（发布需企业账号且已通过审核）。');
            } else {
                alert('发布失败：' + (result.message || result.msg || '未知错误'));
            }
        } catch (error) {
            console.error('发布需求出错:', error);
            alert('发布失败，请检查网络连接');
        }
    },
    
    // 提交供应
    submitSupply: async function() {
        if (!this.assertEnterprisePublishAllowed()) return;
        const title = document.getElementById('supplyTitle').value.trim();
        const type = document.getElementById('supplyType').value;
        const price = document.getElementById('supplyPrice').value.trim();
        const description = document.getElementById('supplyDescription').value.trim();
        const companyName = document.getElementById('supplyCompanyName').value.trim();
        const contactName = document.getElementById('supplyContactName').value.trim();
        const phone = document.getElementById('supplyPhone').value.trim();
        const email = document.getElementById('supplyEmail').value.trim();
        const location = (document.getElementById('supplyLocation') && document.getElementById('supplyLocation').value.trim()) || '浙江省湖州市';

        if (!title || !type || !price || !description || !companyName || !contactName || !phone || !email) {
            alert('请填写所有带 * 的必填项');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }

        const requestData = {
            title: title,
            type: type,
            category: this.getTypeCategory(type, 'supply'),
            description: description,
            companyName: companyName,
            contactName: contactName,
            contactPhone: phone,
            email: email,
            location: location,
            price: price,
            capacity: document.getElementById('supplyCapacity').value.trim() || null,
            tags: document.getElementById('supplyTags').value.trim() || null,
            advantages: null,
            certifications: null,
            specifications: null,
            attachments: this.pendingSupplyAttachments && this.pendingSupplyAttachments.length ? this.pendingSupplyAttachments : []
        };

        try {
            const response = await fetch(`${API_BASE_URL}/supply/supplies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json().catch(function() { return {}; });
            if (result.code === 200) {
                this.pendingSupplyAttachments = [];
                const overlay = document.querySelector('.publish-modal-overlay');
                if (overlay) overlay.remove();
                document.body.style.overflow = 'auto';
                await this.loadSuppliesFromAPI();
                alert('供应发布成功！');
            } else if (response.status === 401) {
                alert('登录已失效或无权访问，请重新登录（发布需企业账号且已通过审核）。');
            } else {
                alert('发布失败：' + (result.message || result.msg || '未知错误'));
            }
        } catch (error) {
            console.error('发布供应出错:', error);
            alert('发布失败，请检查网络连接');
        }
    },
    
    // 获取类型分类
    getTypeCategory: function(type, mode = 'demand') {
        const categories = {
            demand: {
                material: '原材料需求',
                processing: '加工服务需求',
                design: '设计服务需求',
                accessory: '辅料配件需求',
                logistics: '物流服务需求'
            },
            supply: {
                material: '原材料供应',
                processing: '加工服务',
                design: '设计服务',
                accessory: '辅料配件供应',
                logistics: '物流服务'
            }
        };
        
        return categories[mode][type] || type;
    },
    
    // 获取紧急程度文本
    getUrgencyText: function(urgency) {
        const urgencyMap = {
            'high': '紧急',
            'medium': '一般',
            'low': '不急'
        };
        return urgencyMap[urgency] || '';
    },
    
    // 获取状态文本
    getStatusText: function(status, type) {
        const statusMap = {
            demand: {
                'open': '未对接',
                'inprocess': '对接中',
                'completed': '已完成',
                'cancelled': '已取消'
            },
            supply: {
                'available': '可供应',
                'busy': '产能紧张',
                'unavailable': '暂不可用',
                'completed': '已完成'
            }
        };
        
        return statusMap[type][status] || status;
    },

    // ========== 辅助函数 ==========
    /** HTML 转义防止 XSS */
    escapeHtml: function(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/'/g, "\\'").replace(/"/g, '\\"');
    },

    // ========== 供需对接聊天功能 ==========

    /** 打开对接聊天窗口 */
    _openConnectionChat: async function(connectionId, otherUserId, otherCompanyName) {
        if (!otherUserId) {
            alert('无法获取对方用户信息');
            return;
        }

        // 获取当前用户信息
        var token = localStorage.getItem('token');
        var userInfoRaw = localStorage.getItem('userInfo');
        if (!token || !userInfoRaw) {
            alert('请先登录');
            return;
        }

        var currentUser;
        try {
            currentUser = JSON.parse(userInfoRaw);
        } catch (e) {
            alert('用户信息解析失败');
            return;
        }

        // 打开聊天窗口
        this._showConnectionChatWindow(connectionId, otherUserId, otherCompanyName, currentUser.id);
    },

    /** 显示对接聊天窗口 */
    _showConnectionChatWindow: function(connectionId, otherUserId, otherCompanyName, myUserId) {
        // 检查是否已打开
        var existingChat = document.getElementById('connectionChatWindow');
        if (existingChat) {
            existingChat.remove();
        }

        var chatWindow = document.createElement('div');
        chatWindow.id = 'connectionChatWindow';
        chatWindow.className = 'connection-chat-window';
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <i class="bi bi-chat-dots"></i>
                    <span class="chat-title">与 ${otherCompanyName} 的对接沟通</span>
                </div>
                <button class="chat-close" onclick="this.closest('.connection-chat-window').remove()">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="chat-messages" id="connectionChatMessages">
                <div class="chat-loading"><i class="bi bi-hourglass-split"></i> 加载聊天记录...</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="connectionChatInput" placeholder="输入消息..." onkeypress="if(event.key==='Enter') SupplyDemandManager._sendConnectionMessage(${connectionId}, '${otherUserId}')">
                <button onclick="SupplyDemandManager._sendConnectionMessage(${connectionId}, '${otherUserId}')">
                    <i class="bi bi-send"></i> 发送
                </button>
            </div>
        `;

        document.body.appendChild(chatWindow);

        // 加载聊天记录
        this._loadConnectionChatHistory(connectionId, otherUserId);

        // 标记消息已读
        this._markConnectionChatRead(connectionId);

        // 初始化 WebSocket 聊天订阅（订阅自己的频道，后端推送到接收者频道）
        this._initConnectionChatWebSocket(connectionId, myUserId);
    },

    /** 加载对接聊天记录 */
    _loadConnectionChatHistory: async function(connectionId, otherUserId) {
        var token = localStorage.getItem('token');
        var msgContainer = document.getElementById('connectionChatMessages');
        if (!msgContainer) return;

        try {
            var response = await fetch(API_BASE_URL + '/auth/chat/messages?otherUserId=' + encodeURIComponent(otherUserId) + '&connectionId=' + connectionId, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            if (result.code === 200 && result.data && result.data.length > 0) {
                var html = '';
                var userInfoRaw = localStorage.getItem('userInfo');
                var myUserId = '';
                try { myUserId = JSON.parse(userInfoRaw).id; } catch (e) {}

                result.data.forEach(function(msg) {
                    var isMe = msg.senderId === myUserId;
                    var alignClass = isMe ? 'chat-msg-mine' : 'chat-msg-other';
                    var avatar = isMe ? '<i class="bi bi-person-circle"></i>' : '<i class="bi bi-building"></i>';
                    var time = msg.createdAt ? msg.createdAt.substring(11, 16) : '';

                    html += '<div class="chat-msg ' + alignClass + '">';
                    html += '<div class="chat-avatar">' + avatar + '</div>';
                    html += '<div class="chat-bubble">' + SupplyDemandManager.escapeHtml(msg.content || '') + '</div>';
                    if (time) {
                        html += '<div class="chat-time">' + time + '</div>';
                    }
                    html += '</div>';
                });

                msgContainer.innerHTML = html;
                msgContainer.scrollTop = msgContainer.scrollHeight;
            } else {
                msgContainer.innerHTML = '<div class="chat-empty"><i class="bi bi-chat-left-text"></i> 暂无聊天记录，开始对话吧！</div>';
            }
        } catch (error) {
            console.error('加载聊天记录失败:', error);
            msgContainer.innerHTML = '<div class="chat-error"><i class="bi bi-exclamation-triangle"></i> 加载失败</div>';
        }
    },

    /** 发送对接聊天消息 */
    _sendConnectionMessage: async function(connectionId, otherUserId) {
        var input = document.getElementById('connectionChatInput');
        if (!input) return;

        var content = input.value.trim();
        if (!content) return;

        input.value = '';
        input.disabled = true;

        var token = localStorage.getItem('token');
        var msgContainer = document.getElementById('connectionChatMessages');

        try {
            var response = await fetch(API_BASE_URL + '/auth/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    toUserId: otherUserId,
                    connectionId: connectionId,
                    content: content
                })
            });

            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            if (result.code === 200) {
                // 乐观更新 UI
                var userInfoRaw = localStorage.getItem('userInfo');
                var myUserId = '';
                try { myUserId = JSON.parse(userInfoRaw).id; } catch (e) {}

                var time = result.data && result.data.createdAt ? result.data.createdAt.substring(11, 16) : '';
                var html = '<div class="chat-msg chat-msg-mine">';
                html += '<div class="chat-avatar"><i class="bi bi-person-circle"></i></div>';
                html += '<div class="chat-bubble">' + this.escapeHtml(content) + '</div>';
                if (time) {
                    html += '<div class="chat-time">' + time + '</div>';
                }
                html += '</div>';

                var emptyMsg = msgContainer.querySelector('.chat-empty');
                if (emptyMsg) { emptyMsg.remove(); }

                msgContainer.insertAdjacentHTML('beforeend', html);
                msgContainer.scrollTop = msgContainer.scrollHeight;
            } else {
                alert('发送失败：' + (result.message || '未知错误'));
                input.value = content;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            alert('发送失败，请检查网络连接');
            input.value = content;
        }

        input.disabled = false;
        input.focus();
    },

    /** 标记对接聊天已读 */
    _markConnectionChatRead: async function(connectionId) {
        var token = localStorage.getItem('token');
        try {
            await fetch(API_BASE_URL + '/auth/chat/mark-connection-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ connectionId: connectionId })
            });
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    },

    /** 初始化对接聊天的 WebSocket 订阅（订阅自己的频道接收对方消息） */
    _initConnectionChatWebSocket: function(connectionId, myUserId) {
        var self = this;

        // 监听自己的消息频道（后端 pushToReceiver 推到接收者频道，也就是我自己的频道）
        if (this.wsClient && this.wsConnected) {
            var subscription = this.wsClient.subscribe('/topic/chat/user/' + myUserId, function(message) {
                var msg = JSON.parse(message.body);
                // 只处理属于这个对接的消息，且过滤自己发出的
                if (msg.connectionId == connectionId && msg.senderId != myUserId) {
                    self._appendIncomingConnectionMessage(msg);
                }
            });

            if (!this.connectionChatSubscriptions) {
                this.connectionChatSubscriptions = [];
            }
            this.connectionChatSubscriptions.push(subscription);
        }
    },

    /** 追加收到的对接聊天消息 */
    _appendIncomingConnectionMessage: function(msg) {
        var msgContainer = document.getElementById('connectionChatMessages');
        if (!msgContainer) return;

        var html = '<div class="chat-msg chat-msg-other">';
        html += '<div class="chat-avatar"><i class="bi bi-building"></i></div>';
        html += '<div class="chat-bubble">' + this.escapeHtml(msg.content || '') + '</div>';
        if (msg.createdAt) {
            var time = typeof msg.createdAt === 'string' ? msg.createdAt.substring(11, 16) : '';
            if (time) {
                html += '<div class="chat-time">' + time + '</div>';
            }
        }
        html += '</div>';

        msgContainer.insertAdjacentHTML('beforeend', html);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        this._playMessageSound();
    },

    /** 播放消息提示音 */
    _playMessageSound: function() {
        try {
            var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRYQaLz26dulXxYQbML66Oa1YCMPdM7+8+i4Zz0bh9T+/+6+czwhjNj//vLAdkcklt3///PAdk0pl+/+');
            audio.volume = 0.3;
            audio.play().catch(function() {});
        } catch (e) {}
    },

    // ===================== 消息列表（我的发布供需） =====================
    showMyPublishedItems: async function() {
        var token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录后查看');
            return;
        }

        // 初始化 WebSocket 连接
        this.initWebSocket();

        // 重置未读数
        this.resetUnreadCount();

        var self = this;

        // 创建弹窗
        var modal = document.createElement('div');
        modal.className = 'inventory-modal show';
        modal.innerHTML = `
            <div class="modal-content msg-modal">
                <div class="modal-header">
                    <h3><i class="bi bi-chat-dots-fill"></i> 消息列表</h3>
                    <span class="modal-close" onclick="this.closest('.inventory-modal').remove(); document.body.style.overflow = 'auto'">&times;</span>
                </div>
                <div class="modal-body" id="msgListBody">
                    <div class="empty-state"><i class="bi bi-hourglass-split"></i> 加载中...</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        try {
            var response = await fetch(API_BASE_URL + '/supply/connections/published', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            var body = document.getElementById('msgListBody');
            if (!body) { return; }

            if (result.code !== 200 || !result.data || result.data.length === 0) {
                body.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i> 暂无发布记录，发布需求或供应后将在此显示对接信息</div>';
                return;
            }

            var html = '<div class="msg-tabs">';
            html += '<button class="msg-tab active" onclick="SupplyDemandManager._switchMsgTab(this, \'all\')">全部</button>';
            html += '<button class="msg-tab" onclick="SupplyDemandManager._switchMsgTab(this, \'demand\')">需求</button>';
            html += '<button class="msg-tab" onclick="SupplyDemandManager._switchMsgTab(this, \'supply\')">供应</button>';
            html += '<button class="msg-tab" onclick="SupplyDemandManager._switchSentTab(this)" id="sentTab">我发出的</button>';
            html += '</div>';

            html += '<div class="msg-list" id="msgListContainer">';
            result.data.forEach(function(item) {
                var typeIcon = item.type === 'demand' ? '<i class="bi bi-cart-fill"></i>' : '<i class="bi bi-box-seam"></i>';
                var typeLabel = item.type === 'demand' ? '需求' : '供应';
                var statusClass = 'status-' + item.status;
                var statusText = item.status === 'open' ? '未对接' : (item.status === 'inprocess' || item.status === 'busy' ? '对接中' : (item.status === 'completed' ? '已完成' : item.status));

                html += '<div class="msg-item" data-type="' + item.type + '">';
                html += '<div class="msg-item-header" onclick="SupplyDemandManager._toggleMsgDetail(this)">';
                html += '<div class="msg-item-left">';
                html += '<span class="msg-type-badge ' + item.type + '">' + typeIcon + ' ' + typeLabel + '</span>';
                html += '<span class="msg-title">' + (item.title || '') + '</span>';
                html += '</div>';
                html += '<div class="msg-item-right">';
                html += '<span class="msg-status-badge ' + statusClass + '">' + statusText + '</span>';
                var connCount = item.totalConnections || 0;
                if (connCount > 0) {
                    html += '<span class="msg-conn-count">' + connCount + '条对接</span>';
                }
                html += '<i class="bi bi-chevron-down msg-arrow"></i>';
                html += '</div>';
                html += '</div>';

                // 对接详情
                html += '<div class="msg-item-detail" style="display:none;">';
                if (!item.connections || item.connections.length === 0) {
                    html += '<div class="msg-no-connection">暂无对接记录</div>';
                } else {
                    html += '<div class="msg-connections">';
                    item.connections.forEach(function(conn) {
                        var connStatusClass = 'conn-status-' + (conn.status || 'negotiating');
                        var connStatusText = conn.status === 'negotiating' ? '洽谈中' : (conn.status === 'completed' ? '已完成' : '已取消');
                        html += '<div class="conn-record">';
                        html += '<div class="conn-record-header">';
                        html += '<span class="conn-id">#' + (conn.connectionId || '') + '</span>';
                        html += '<span class="conn-status ' + connStatusClass + '">' + connStatusText + '</span>';
                        if (conn.startDate) {
                            html += '<span class="conn-date">' + conn.startDate + '</span>';
                        }
                        html += '</div>';

                        // 申请方信息
                        if (conn.applicantCompanyName) {
                            html += '<div class="conn-party-info">';
                            html += '<div class="conn-party-title"><i class="bi bi-building"></i> 对方企业</div>';
                            html += '<div class="conn-party-row"><label>企业名称：</label><span>' + (conn.applicantCompanyName || '-') + '</span></div>';
                            if (conn.applicantContactName) {
                                html += '<div class="conn-party-row"><label>联系人：</label><span>' + conn.applicantContactName + '</span></div>';
                            }
                            if (conn.applicantContactPhone) {
                                html += '<div class="conn-party-row"><label>联系电话：</label><span class="conn-phone">' + conn.applicantContactPhone + '</span></div>';
                            }
                            if (conn.applicantContactEmail) {
                                html += '<div class="conn-party-row"><label>联系邮箱：</label><span>' + conn.applicantContactEmail + '</span></div>';
                            }
                            html += '</div>';
                        } else {
                            html += '<div class="msg-no-connection">暂无对接方信息</div>';
                        }

                        // 对接说明
                        if (conn.notes) {
                            html += '<div class="conn-notes"><label><i class="bi bi-card-text"></i> 对接说明：</label><span>' + conn.notes + '</span></div>';
                        }

                        // 操作按钮
                        if (conn.status === 'negotiating') {
                            html += '<div class="conn-actions">';
                            html += '<button class="btn-sm btn-success" onclick="SupplyDemandManager._completeConnection(' + conn.id + ', this)"><i class="bi bi-check-circle"></i> 标记完成</button>';
                            html += '<button class="btn-sm btn-primary" onclick="SupplyDemandManager._openConnectionChat(' + conn.id + ', \'' + (conn.applicantUserId || '') + '\', \'' + escapeHtml(conn.applicantCompanyName || '对方') + '\')"><i class="bi bi-chat-dots"></i> 发起聊天</button>';
                            html += '<button class="btn-sm btn-danger" onclick="SupplyDemandManager._cancelConnection(' + conn.id + ', this)"><i class="bi bi-x-circle"></i> 取消对接</button>';
                            html += '</div>';
                        } else if (conn.status === 'completed') {
                            // 已完成的对接也可以聊天
                            html += '<div class="conn-actions">';
                            html += '<button class="btn-sm btn-primary" onclick="SupplyDemandManager._openConnectionChat(' + conn.id + ', \'' + (conn.applicantUserId || '') + '\', \'' + escapeHtml(conn.applicantCompanyName || '对方') + '\')"><i class="bi bi-chat-dots"></i> 发起聊天</button>';
                            html += '</div>';
                        }
                        html += '</div>';
                    });
                    html += '</div>';
                }
                html += '</div>'; // end msg-item-detail
                html += '</div>'; // end msg-item
            });
            html += '</div>';

            body.innerHTML = html;

        } catch (error) {
            console.error('加载消息列表出错:', error);
            var body = document.getElementById('msgListBody');
            if (body) {
                var msg = '加载失败';
                if (error && error.message && error.message.indexOf('401') !== -1) msg = '请先登录后查看';
                else if (error && error.message && error.message.indexOf('403') !== -1) msg = '仅企业用户可查看';
                else msg = '加载失败，请确认后端已启动（端口8080）并刷新重试';
                body.innerHTML = '<div class="empty-state" style="color:#e74c3c"><i class="bi bi-exclamation-triangle"></i> ' + msg + '</div><div style="text-align:center;margin-top:10px"><button onclick="SupplyDemandManager.showMyPublishedItems()" style="padding:8px 16px;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">重试</button></div>';
            }
        }
    },

    // 切换消息列表Tab
    _switchMsgTab: function(btn, type) {
        var tabs = btn.parentElement.querySelectorAll('.msg-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');

        // 隐藏我发出的列表
        var sentList = document.getElementById('sentConnectionsList');
        if (sentList) { sentList.style.display = 'none'; }

        // 显示发布列表
        var publishedList = document.getElementById('msgListContainer');
        if (publishedList) { publishedList.style.display = ''; }

        var items = document.querySelectorAll('.msg-item');
        items.forEach(function(item) {
            if (type === 'all' || item.getAttribute('data-type') === type) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    // 显示我发出的对接申请
    _switchSentTab: async function(btn) {
        var tabs = btn.parentElement.querySelectorAll('.msg-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');

        var token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录后查看');
            return;
        }

        // 隐藏发布列表
        var publishedList = document.getElementById('msgListContainer');
        if (publishedList) { publishedList.style.display = 'none'; }

        // 检查是否已有我发出的列表
        var sentList = document.getElementById('sentConnectionsList');
        if (!sentList) {
            var container = document.createElement('div');
            container.id = 'sentConnectionsList';
            container.innerHTML = '<div class="empty-state"><i class="bi bi-hourglass-split"></i> 加载中...</div>';
            var msgListBody = document.getElementById('msgListBody');
            if (msgListBody) { msgListBody.appendChild(container); }
        } else {
            sentList.style.display = '';
            sentList.innerHTML = '<div class="empty-state"><i class="bi bi-hourglass-split"></i> 加载中...</div>';
        }

        try {
            var response = await fetch(API_BASE_URL + '/supply/connections/my', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            var sentListEl = document.getElementById('sentConnectionsList');
            if (!sentListEl) { return; }

            if (result.code !== 200 || !result.data || result.data.length === 0) {
                sentListEl.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i> 您还没有发出过对接申请</div>';
                return;
            }

            // 获取当前用户ID，用于正确判断对方身份
            var currentUserId = null;
            var userInfoRaw = localStorage.getItem('userInfo');
            if (userInfoRaw) {
                try { var u = JSON.parse(userInfoRaw); currentUserId = u.id; } catch (e) {}
            }

            var html = '<div class="sent-connections-list">';
            html += '<div class="sent-list-header"><i class="bi bi-send"></i> 我发出的对接申请</div>';
            result.data.forEach(function(conn) {
                var connStatusClass = 'conn-status-' + (conn.status || 'negotiating');
                var connStatusText = conn.status === 'negotiating' ? '洽谈中' : (conn.status === 'completed' ? '已完成' : (conn.status === 'cancelled' ? '已撤销' : conn.status));
                var isCancelled = conn.status === 'cancelled' || conn.status === 'completed';

                // 正确判断对方用户ID：如果当前用户是申请者，对方是发布者；如果当前用户是发布者，对方是申请者
                var otherUserId = '';
                var otherCompanyName = '对方';
                if (currentUserId && currentUserId === conn.applicantUserId) {
                    // 当前用户是申请者，对方是需求/供应的发布者
                    otherUserId = conn.demandUserId || conn.supplyUserId || '';
                    otherCompanyName = conn.demandCompanyName || conn.supplyCompanyName || '对方';
                } else {
                    // 当前用户是发布者，对方是申请者
                    otherUserId = conn.applicantUserId || '';
                    otherCompanyName = conn.applicantCompanyName || '对方';
                }

                html += '<div class="sent-conn-item">';
                html += '<div class="sent-conn-header">';
                html += '<span class="sent-conn-id">#' + (conn.connectionId || '') + '</span>';
                html += '<span class="conn-status ' + connStatusClass + '">' + connStatusText + '</span>';
                if (conn.createdAt) {
                    html += '<span class="sent-conn-date">' + conn.createdAt + '</span>';
                }
                html += '</div>';

                // 目标信息（你对接的需求或供应）
                html += '<div class="sent-target-info">';
                if (conn.demandTitle) {
                    html += '<div class="sent-target-type"><i class="bi bi-cart-fill"></i> 需求：' + conn.demandTitle + '</div>';
                    if (conn.demandCompanyName) {
                        html += '<div class="sent-target-company"><i class="bi bi-building"></i> ' + conn.demandCompanyName + '</div>';
                    }
                } else if (conn.supplyTitle) {
                    html += '<div class="sent-target-type"><i class="bi bi-box-seam"></i> 供应：' + conn.supplyTitle + '</div>';
                    if (conn.supplyCompanyName) {
                        html += '<div class="sent-target-company"><i class="bi bi-building"></i> ' + conn.supplyCompanyName + '</div>';
                    }
                }
                html += '</div>';

                // 对接说明
                if (conn.notes) {
                    html += '<div class="conn-notes"><label><i class="bi bi-card-text"></i> 合作意向：</label><span>' + conn.notes + '</span></div>';
                }

                // 撤销按钮（仅洽谈中状态显示）
                if (conn.status === 'negotiating') {
                    html += '<div class="conn-actions">';
                    html += '<button class="btn-sm btn-primary" onclick="SupplyDemandManager._openConnectionChat(' + conn.id + ', \'' + otherUserId + '\', \'' + escapeHtml(otherCompanyName) + '\')"><i class="bi bi-chat-dots"></i> 发起聊天</button>';
                    html += '<button class="btn-sm btn-danger" onclick="SupplyDemandManager._revokeConnection(' + conn.id + ', this)"><i class="bi bi-arrow-left-circle"></i> 撤销对接</button>';
                    html += '</div>';
                } else if (conn.status === 'completed') {
                    // 已完成的对接也可以聊天
                    html += '<div class="conn-actions">';
                    html += '<button class="btn-sm btn-primary" onclick="SupplyDemandManager._openConnectionChat(' + conn.id + ', \'' + otherUserId + '\', \'' + escapeHtml(otherCompanyName) + '\')"><i class="bi bi-chat-dots"></i> 发起聊天</button>';
                    html += '</div>';
                }
                html += '</div>';
            });
            html += '</div>';

            sentListEl.innerHTML = html;

        } catch (error) {
            console.error('加载我发出的对接出错:', error);
            var sentListEl = document.getElementById('sentConnectionsList');
            if (sentListEl) {
                sentListEl.innerHTML = '<div class="empty-state" style="color:#e74c3c"><i class="bi bi-exclamation-triangle"></i> 加载失败，请确认后端已启动（端口8080）并刷新重试</div><div style="text-align:center;margin-top:10px"><button onclick="SupplyDemandManager._switchSentTab(document.getElementById(\'sentTab\'))" style="padding:8px 16px;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff">重试</button></div>';
            }
        }
    },

    // 撤销对接申请
    _revokeConnection: async function(connId, btn) {
        if (!confirm('确认撤销此对接申请？撤销后将无法恢复。')) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> 撤销中...';

        var token = localStorage.getItem('token');
        try {
            var response = await fetch(API_BASE_URL + '/supply/connections/' + connId + '/status?status=cancelled', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            if (result.code === 200) {
                alert('对接申请已撤销');
                // 刷新列表
                this._switchSentTab(document.getElementById('sentTab'));
            } else {
                alert('撤销失败：' + (result.message || result.msg || '未知错误'));
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-arrow-left-circle"></i> 撤销对接';
            }
        } catch (error) {
            console.error('撤销对接出错:', error);
            alert('撤销失败，请检查网络连接');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-arrow-left-circle"></i> 撤销对接';
        }
    },

    // 展开/收起对接详情
    _toggleMsgDetail: function(header) {
        var item = header.closest('.msg-item');
        var detail = item.querySelector('.msg-item-detail');
        var arrow = item.querySelector('.msg-arrow');
        if (detail.style.display === 'none') {
            detail.style.display = '';
            arrow.classList.remove('bi-chevron-down');
            arrow.classList.add('bi-chevron-up');
        } else {
            detail.style.display = 'none';
            arrow.classList.remove('bi-chevron-up');
            arrow.classList.add('bi-chevron-down');
        }
    },

    // 标记对接完成
    _completeConnection: async function(connId, btn) {
        if (!confirm('确认将此对接标记为已完成？')) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> 处理中...';

        var token = localStorage.getItem('token');
        try {
            var response = await fetch(API_BASE_URL + '/supply/connections/' + connId + '/status?status=completed', {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }
            if (result.code === 200) {
                alert('对接已标记完成');
                // 刷新列表
                this.showMyPublishedItems();
            } else {
                alert('操作失败：' + (result.message || result.msg || '未知错误'));
                btn.disabled = false;
            }
        } catch (error) {
            alert('操作失败，请检查网络连接');
            btn.disabled = false;
        }
    },

    // 取消对接
    _cancelConnection: async function(connId, btn) {
        if (!confirm('确认取消此对接？')) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> 处理中...';

        var token = localStorage.getItem('token');
        try {
            var response = await fetch(API_BASE_URL + '/supply/connections/' + connId + '/status?status=cancelled', {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            var result = {};
            try { result = await response.json(); } catch (e) { result = {}; }
            if (result.code === 200) {
                alert('对接已取消');
                this.showMyPublishedItems();
            } else {
                alert('操作失败：' + (result.message || result.msg || '未知错误'));
                btn.disabled = false;
            }
        } catch (error) {
            alert('操作失败，请检查网络连接');
            btn.disabled = false;
        }
    }
};

// 分页管理系统
const PaginationManager = {
    // 分页配置
    config: {
        inbound: { currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 },
        outbound: { currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 },
        transfer: { currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 }
    },
    
    // 初始化分页
    init: function(type) {
        this.updatePaginationInfo(type);
        this.updatePaginationControls(type);
    },
    
    // 更新分页信息
    updatePaginationInfo: function(type) {
        let totalRecords = 0;
        switch (type) {
            case 'inbound':
                totalRecords = InventoryDB.inboundRecords.length;
                break;
            case 'outbound':
                totalRecords = InventoryDB.outboundRecords.length;
                break;
            case 'transfer':
                totalRecords = InventoryDB.transferRecords.length;
                break;
        }
        
        const config = this.config[type];
        config.totalRecords = totalRecords;
        config.totalPages = Math.ceil(totalRecords / config.pageSize);
        
        // 确保当前页不超出范围
        if (config.currentPage > config.totalPages) {
            config.currentPage = Math.max(1, config.totalPages);
        }
    },
    
    // 获取当前页数据
    getCurrentPageData: function(type) {
        let allRecords = [];
        switch (type) {
            case 'inbound':
                allRecords = InventoryDB.inboundRecords;
                break;
            case 'outbound':
                allRecords = InventoryDB.outboundRecords;
                break;
            case 'transfer':
                allRecords = InventoryDB.transferRecords;
                break;
        }
        
        const config = this.config[type];
        const startIndex = (config.currentPage - 1) * config.pageSize;
        const endIndex = startIndex + config.pageSize;
        
        return allRecords.slice(startIndex, endIndex);
    },
    
    // 跳转到指定页
    goToPage: function(type, page) {
        const config = this.config[type];
        if (page >= 1 && page <= config.totalPages) {
            config.currentPage = page;
            this.loadPageData(type);
            this.updatePaginationControls(type);
        }
    },
    
    // 上一页
    previousPage: function(type) {
        const config = this.config[type];
        if (config.currentPage > 1) {
            this.goToPage(type, config.currentPage - 1);
        }
    },
    
    // 下一页
    nextPage: function(type) {
        const config = this.config[type];
        if (config.currentPage < config.totalPages) {
            this.goToPage(type, config.currentPage + 1);
        }
    },
    
    // 改变每页显示数量
    changePageSize: function(type, newSize) {
        const config = this.config[type];
        config.pageSize = parseInt(newSize);
        config.currentPage = 1; // 重置到第一页
        this.updatePaginationInfo(type);
        this.loadPageData(type);
        this.updatePaginationControls(type);
    },
    
    // 加载页面数据
    loadPageData: function(type) {
        const pageData = this.getCurrentPageData(type);
        this.renderTableData(type, pageData);
    },
    
    // 渲染表格数据
    renderTableData: function(type, data) {
        const tableBody = document.getElementById(`${type}TableBody`);
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="8" style="text-align: center; color: #999; padding: 40px;">暂无数据</td>';
            tableBody.appendChild(tr);
            return;
        }
        
        data.forEach(record => {
            let rowData = [];
            
            switch (type) {
                case 'inbound':
                    const supplier = InventoryDB.suppliers.find(s => s.id === record.supplier);
                    const warehouse = InventoryDB.warehouses.find(w => w.id === record.warehouse);
                    const statusText = getStatusText(record.status);
                    const productCount = record.products.length;
                    
                    rowData = [
                        record.id,
                        record.date,
                        supplier ? supplier.name : '未知供应商',
                        warehouse ? warehouse.name : '未知仓库',
                        productCount,
                        `¥${record.totalAmount.toLocaleString()}`,
                        `<span class="status-badge ${record.status}">${statusText}</span>`,
                        `<button class="btn-small" onclick="viewRecord('${record.id}', 'inbound')">查看</button> | 
                         <button class="btn-small" onclick="editRecord('${record.id}', 'inbound')">编辑</button> |
                         <button class="btn-small" onclick="deleteRecord('${record.id}', 'inbound')">删除</button>`
                    ];
                    break;
                    
                case 'outbound':
                    const outWarehouse = InventoryDB.warehouses.find(w => w.id === record.warehouse);
                    const customer = InventoryDB.customers.find(c => c.id === record.customer) || 
                                   InventoryDB.warehouses.find(w => w.id === record.customer);
                    const outStatusText = getStatusText(record.status);
                    const outProductCount = record.products.length;
                    const typeText = getOutboundTypeText(record.type);
                    
                    rowData = [
                        record.id,
                        record.date,
                        typeText,
                        outWarehouse ? outWarehouse.name : '未知仓库',
                        customer ? customer.name : '未知客户',
                        outProductCount,
                        `<span class="status-badge ${record.status}">${outStatusText}</span>`,
                        `<button class="btn-small" onclick="viewRecord('${record.id}', 'outbound')">查看</button> | 
                         <button class="btn-small" onclick="editRecord('${record.id}', 'outbound')">编辑</button> |
                         <button class="btn-small" onclick="deleteRecord('${record.id}', 'outbound')">删除</button>`
                    ];
                    break;
                    
                case 'transfer':
                    const fromWarehouse = InventoryDB.warehouses.find(w => w.id === record.fromWarehouse);
                    const toWarehouse = InventoryDB.warehouses.find(w => w.id === record.toWarehouse);
                    const transferStatusText = getStatusText(record.status);
                    const transferProductCount = record.products.length;
                    const reasonText = getTransferReasonText(record.reason);
                    
                    rowData = [
                        record.id,
                        record.date,
                        fromWarehouse ? fromWarehouse.name : '未知仓库',
                        toWarehouse ? toWarehouse.name : '未知仓库',
                        transferProductCount,
                        reasonText,
                        `<span class="status-badge ${record.status}">${transferStatusText}</span>`,
                        `<button class="btn-small" onclick="viewRecord('${record.id}', 'transfer')">查看</button> | 
                         <button class="btn-small" onclick="editRecord('${record.id}', 'transfer')">编辑</button> |
                         <button class="btn-small" onclick="deleteRecord('${record.id}', 'transfer')">删除</button>`
                    ];
                    break;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = rowData.map(cell => `<td>${cell}</td>`).join('');
            tableBody.appendChild(tr);
        });
    },
    
    // 更新分页控制器
    updatePaginationControls: function(type) {
        const config = this.config[type];
        const paginationContainer = document.querySelector(`#${type}Pagination`);
        
        if (!paginationContainer) return;
        
        // 更新页码信息
        const pageInfo = paginationContainer.querySelector('.page-info');
        if (pageInfo) {
            pageInfo.textContent = `第 ${config.currentPage} 页，共 ${config.totalPages} 页 (总计 ${config.totalRecords} 条记录)`;
        }
        
        // 更新按钮状态
        const prevBtn = paginationContainer.querySelector('.btn-prev');
        const nextBtn = paginationContainer.querySelector('.btn-next');
        
        if (prevBtn) {
            prevBtn.disabled = config.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = config.currentPage >= config.totalPages;
        }
        
        // 更新页码按钮
        this.updatePageNumbers(type);
    },
    
    // 更新页码按钮
    updatePageNumbers: function(type) {
        const config = this.config[type];
        const paginationContainer = document.querySelector(`#${type}Pagination`);
        const pageNumbersContainer = paginationContainer.querySelector('.page-numbers');
        
        if (!pageNumbersContainer) return;
        
        pageNumbersContainer.innerHTML = '';
        
        // 计算显示的页码范围
        const maxVisiblePages = 5;
        let startPage = Math.max(1, config.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(config.totalPages, startPage + maxVisiblePages - 1);
        
        // 调整起始页
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // 添加第一页和省略号
        if (startPage > 1) {
            this.addPageButton(pageNumbersContainer, type, 1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            this.addPageButton(pageNumbersContainer, type, i);
        }
        
        // 添加最后一页和省略号
        if (endPage < config.totalPages) {
            if (endPage < config.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
            this.addPageButton(pageNumbersContainer, type, config.totalPages);
        }
    },
    
    // 添加页码按钮
    addPageButton: function(container, type, pageNumber) {
        const config = this.config[type];
        const button = document.createElement('button');
        button.className = `btn-page ${pageNumber === config.currentPage ? 'active' : ''}`;
        button.textContent = pageNumber;
        button.onclick = () => this.goToPage(type, pageNumber);
        container.appendChild(button);
    }
};

// 页面加载完成后初始化供需对应功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化供需对应列表
    if (document.querySelector('.card-list')) {
        SupplyDemandManager.updateSupplyDemandList('demand');
    }
}); 