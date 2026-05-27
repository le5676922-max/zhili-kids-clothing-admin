document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM加载完成，开始初始化企业页面功能");

    // API 基础地址（公网 80 端口走 Nginx 同域 /api）
    var API_BASE = window.ZhiliApi.apiAuth();

    // 企业列表（从接口加载后存储）
    window.enterpriseList = [];

    // 先加载企业数据并渲染，再初始化详情弹窗与视图/分页
    loadAndRenderEnterprises();

    // 视图切换功能
    const viewToggleButtons = document.querySelectorAll('.view-toggle button');
    const enterpriseList = document.getElementById('enterpriseListContainer');
    const PAGE_SIZE = 6;

    /** 从接口加载企业列表并渲染卡片（带超时，避免一直加载中） */
    function loadAndRenderEnterprises() {
        var loadingEl = document.getElementById('enterpriseListLoading');
        var emptyEl = document.getElementById('enterpriseListEmpty');
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';

        function hideLoadingAndShow(msg) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = msg || '加载失败'; }
        }

        var abort = new AbortController();
        var timeoutId = setTimeout(function () {
            abort.abort();
        }, 10000);

        fetch(API_BASE + '/enterprises', { signal: abort.signal })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                clearTimeout(timeoutId);
                if (loadingEl) loadingEl.style.display = 'none';
                if (!data || !Array.isArray(data.data)) {
                    window.enterpriseList = [];
                    hideLoadingAndShow((data && data.code !== 200) ? (data.message || '加载失败') : '加载失败或暂无企业信息');
                    return;
                }
                if (data.code !== 200) {
                    window.enterpriseList = [];
                    hideLoadingAndShow(data.message || '加载失败');
                    return;
                }
                window.enterpriseList = data.data;
                if (window.enterpriseList.length === 0) {
                    if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = '暂无企业信息'; }
                    return;
                }
                renderEnterpriseCards();
                totalPages = Math.max(1, Math.ceil(window.enterpriseList.length / PAGE_SIZE));
                currentPage = 1;
                showPage(1);
                updatePaginationUI();
                initEnterpriseDetailModal();
            })
            .catch(function (err) {
                clearTimeout(timeoutId);
                console.error('加载企业列表失败', err);
                hideLoadingAndShow(err.name === 'AbortError'
                    ? '请求超时，请确认后端已启动（Java 项目端口 8080）'
                    : '加载失败，请确认后端已启动且页面通过 http 打开（端口 8080）');
            });
    }

    /** 根据 window.enterpriseList 渲染卡片到 #enterpriseListContainer */
    function renderEnterpriseCards() {
        var container = document.getElementById('enterpriseListContainer');
        if (!container) return;
        var list = window.enterpriseList || [];
        var loadingEl = document.getElementById('enterpriseListLoading');
        var emptyEl = document.getElementById('enterpriseListEmpty');
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';

        container.querySelectorAll('.enterprise-card').forEach(function (el) { el.remove(); });

        var pageNum;
        list.forEach(function (ent, index) {
            pageNum = Math.floor(index / PAGE_SIZE) + 1;
            var name = ent.enterpriseName || ent.nickname || '企业';
            var avatarUrl = (ent.avatar && ent.avatar.trim()) ? ent.avatar : '';
            var tags = (ent.enterpriseTags && ent.enterpriseTags.trim()) ? ent.enterpriseTags.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
            var card = document.createElement('div');
            card.className = 'enterprise-card';
            card.setAttribute('data-page', String(pageNum));
            card.setAttribute('data-enterprise-id', ent.id || '');
            var placeholderImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23e0e0e0' width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3E%E6%9A%82%E6%97%A0%3C/text%3E%3C/svg%3E";
            var imgSrc = avatarUrl || placeholderImg;
            var mailto = (ent.enterpriseContactEmail && ent.enterpriseContactEmail.trim()) ? ('mailto:' + escapeHtml(ent.enterpriseContactEmail)) : '#';
            card.innerHTML = [
                '<div class="enterprise-logo"><img src="', imgSrc, '" alt="', escapeHtml(name), '"></div>',
                '<div class="enterprise-info">',
                '<h3>', escapeHtml(name), '</h3>',
                '<p class="enterprise-tags">', tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join(''), '</p>',
                '<p class="enterprise-brief">', escapeHtml(ent.enterpriseIntroduction || '暂无介绍'), '</p>',
                '<div class="enterprise-contact">',
                '<p><i class="bi bi-geo-alt"></i> ', escapeHtml(ent.enterpriseAddress || '-'), '</p>',
                '<p><i class="bi bi-telephone"></i> ', escapeHtml(ent.enterprisePhone || '-'), '</p>',
                '</div>',
                '<div class="enterprise-actions">',
                '<a href="#" class="btn-outline" data-action="detail">查看详情</a>',
                '<a href="', mailto, '" class="btn-primary">联系企业</a>',
                '</div></div>'
            ].join('');
            container.appendChild(card);
        });
    }

    function escapeHtml(str) {
        if (str == null) return '';
        var s = String(str);
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /** 更新分页按钮状态与数量（仅更新当前总页数下的显示） */
    function updatePaginationUI() {
        var links = document.querySelectorAll('.pagination a');
        links.forEach(function (link) {
            var pageAction = link.getAttribute('data-page');
            link.classList.remove('active', 'disabled');
            link.style.display = '';
            if (pageAction === 'prev') {
                if (currentPage <= 1) link.classList.add('disabled');
            } else if (pageAction === 'next') {
                if (currentPage >= totalPages) link.classList.add('disabled');
            } else {
                var num = parseInt(pageAction, 10);
                if (num > totalPages) link.style.display = 'none';
                else if (num === currentPage) link.classList.add('active');
            }
        });
    }

    viewToggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            // 移除所有按钮的active类
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));

            // 添加当前按钮的active类
            this.classList.add('active');

            // 获取视图类型
            const viewType = this.getAttribute('data-view');

            // 移除企业列表的所有视图类
            enterpriseList.classList.remove('grid-view', 'list-view');

            // 添加当前视图类
            enterpriseList.classList.add(`${viewType}-view`);
        });
    });

    // 排序功能
    const sortLinks = document.querySelectorAll('.filter-group a');

    sortLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // 移除所有链接的active类
            sortLinks.forEach(lnk => lnk.classList.remove('active'));

            // 添加当前链接的active类
            this.classList.add('active');

            simulateSorting(this.getAttribute('data-sort') || 'default');
        });
    });

    // ===== 分页功能（在 loadAndRenderEnterprises 完成后由 showPage 驱动）=====
    let currentPage = 1;
    let totalPages = 1;

    // 获取所有分页按钮
    const pageLinks = document.querySelectorAll('.pagination a');

    // 初次不在这里 showPage，等接口返回后渲染完再 showPage(1)

    // 为所有分页按钮添加点击事件
    pageLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const pageAction = this.getAttribute('data-page');
            console.log("点击分页按钮:", pageAction);

            let newPage = currentPage;

            // 处理不同的分页操作
            if (pageAction === 'prev' && currentPage > 1) {
                newPage = currentPage - 1;
            } else if (pageAction === 'next' && currentPage < totalPages) {
                newPage = currentPage + 1;
            } else if (!isNaN(parseInt(pageAction))) {
                newPage = parseInt(pageAction);
            }

            // 如果页码改变，则更新显示
            if (newPage !== currentPage) {
                currentPage = newPage;
                showPage(currentPage);
            }
        });
    });

    // 显示指定页面的企业卡片
    function showPage(pageNum) {
        if (!enterpriseList) return;
        var cards = enterpriseList.querySelectorAll('.enterprise-card');
        pageLinks.forEach(function (link) {
            var linkPage = link.getAttribute('data-page');
            link.classList.remove('active');
            if (linkPage == pageNum) link.classList.add('active');
            if (linkPage === 'prev') link.classList.toggle('disabled', pageNum <= 1);
            else if (linkPage === 'next') link.classList.toggle('disabled', pageNum >= totalPages);
        });
        cards.forEach(function (card) {
            card.style.display = card.getAttribute('data-page') == pageNum ? 'block' : 'none';
        });
    }

    // 搜索表单提交
    const searchForm = document.getElementById('enterprise-search');

    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // 获取搜索条件
            const searchData = {
                name: document.getElementById('enterprise-name').value,
                type: document.getElementById('enterprise-type').value,
                scale: document.getElementById('enterprise-scale').value,
                cert: document.getElementById('enterprise-cert').value
            };

            // 这里可以实现实际的搜索功能
            // 由于目前使用的是静态数据，所以只是模拟搜索效果
            simulateSearch(searchData);
        });
    }

    // 排序：综合排序 | 注册时间 | 企业规模 | 认证数量
    function simulateSorting(sortType) {
        var list = window.enterpriseList;
        if (!list || !list.length) return;
        var arr = list.slice();
        switch (sortType) {
            case 'createdAt':
                // 注册时间：按创建时间倒序（新的在前）
                arr.sort(function (a, b) {
                    var ta = (a.createdAt != null) ? String(a.createdAt) : '';
                    var tb = (b.createdAt != null) ? String(b.createdAt) : '';
                    return tb.localeCompare(ta);
                });
                break;
            case 'scale':
                // 企业规模：从 enterpriseTags 解析 大型企业>中型企业>小型企业，规模大的在前
                function scaleWeight(ent) {
                    var tags = (ent.enterpriseTags || '') + (ent.enterpriseIntroduction || '');
                    if (/大型|大规模/.test(tags)) return 3;
                    if (/中型|中规模/.test(tags)) return 2;
                    if (/小型|小规模/.test(tags)) return 1;
                    return 0;
                }
                arr.sort(function (a, b) {
                    var wa = scaleWeight(a);
                    var wb = scaleWeight(b);
                    if (wb !== wa) return wb - wa;
                    return (a.enterpriseName || '').localeCompare(b.enterpriseName || '');
                });
                break;
            case 'certCount':
                // 认证数量：按认证数量倒序（多的在前）
                function certCount(ent) {
                    var s = (ent.enterpriseCertifications || '').trim();
                    if (!s) return 0;
                    return s.split(/[,，、]/).filter(function (x) { return x.trim(); }).length;
                }
                arr.sort(function (a, b) {
                    var ca = certCount(a);
                    var cb = certCount(b);
                    if (cb !== ca) return cb - ca;
                    return (a.enterpriseName || '').localeCompare(b.enterpriseName || '');
                });
                break;
            case 'default':
            default:
                // 综合排序：按注册时间倒序（与接口默认一致）
                arr.sort(function (a, b) {
                    var ta = (a.createdAt != null) ? String(a.createdAt) : '';
                    var tb = (b.createdAt != null) ? String(b.createdAt) : '';
                    return tb.localeCompare(ta);
                });
                break;
        }
        window.enterpriseList = arr;
        renderEnterpriseCards();
        showPage(currentPage);
        updatePaginationUI();
    }

    // 搜索：暂不请求后端，仅前端按名称过滤后重新渲染（保留原列表备份可恢复）
    function simulateSearch(searchData) {
        var name = (searchData && searchData.name) ? String(searchData.name).trim() : '';
        var type = (searchData && searchData.type) ? String(searchData.type).trim() : '';
        var scale = (searchData && searchData.scale) ? String(searchData.scale).trim() : '';
        var cert = (searchData && searchData.cert) ? String(searchData.cert).trim() : '';
        if (!name && !type && !scale && !cert) {
            loadAndRenderEnterprises();
            return;
        }
        fetch(API_BASE + '/enterprises')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.code !== 200 || !Array.isArray(data.data)) return;
                window.enterpriseList = data.data.filter(function (e) {
                    var n = (e.enterpriseName || e.nickname || '').toLowerCase();
                    var intro = (e.enterpriseIntroduction || '').toLowerCase();
                    var tags = (e.enterpriseTags || '').toLowerCase();
                    var certs = (e.enterpriseCertifications || '').toLowerCase();
                    if (name && n.indexOf(name.toLowerCase()) === -1) return false;
                    if (type && !tags.includes(type) && !intro.includes(type)) return false;
                    if (scale && !tags.includes(scale) && !intro.includes(scale)) return false;
                    if (cert && !certs.includes(cert) && !tags.includes(cert)) return false;
                    return true;
                });
                renderEnterpriseCards();
                totalPages = Math.max(1, Math.ceil(window.enterpriseList.length / PAGE_SIZE));
                currentPage = 1;
                showPage(1);
                updatePaginationUI();
            });
    }

    // 初始化企业详情弹窗（事件委托：在容器上监听“查看详情”点击）
    function initEnterpriseDetailModal() {
        var modal = document.getElementById('enterprise-modal');
        var modalClose = document.querySelector('.modal-close');
        if (!enterpriseList || !modal) return;

        var modalProducts = document.getElementById('modal-products');
        if (modalProducts) modalProducts.style.display = 'none';

        enterpriseList.addEventListener('click', function (e) {
            var detailBtn = e.target.closest('.enterprise-actions .btn-outline[data-action="detail"]');
            if (!detailBtn) return;
            e.preventDefault();
            var card = detailBtn.closest('.enterprise-card');
            var id = card ? card.getAttribute('data-enterprise-id') : '';
            if (id) showEnterpriseDetail(id);
        });

        if (modalClose) modalClose.addEventListener('click', function () { modal.style.display = 'none'; });
        window.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // 显示企业详情（从 window.enterpriseList 按 id 查找）
    function showEnterpriseDetail(userId) {
        var list = window.enterpriseList || [];
        var ent = list.find(function (e) { return (e.id || '') === userId; });
        if (!ent) {
            alert('未找到该企业信息');
            return;
        }
        var name = ent.enterpriseName || ent.nickname || '企业';
        var avatarUrl = (ent.avatar && ent.avatar.trim()) ? ent.avatar : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect fill=\'%23e0e0e0\' width=\'64\' height=\'64\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'10\'%3E暂无%3C/text%3E%3C/svg%3E';
        var tags = (ent.enterpriseTags && ent.enterpriseTags.trim()) ? ent.enterpriseTags.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
        var certs = (ent.enterpriseCertifications && ent.enterpriseCertifications.trim()) ? ent.enterpriseCertifications.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean) : [];

        document.getElementById('modal-logo').src = avatarUrl;
        document.getElementById('modal-logo').alt = name;
        document.getElementById('modal-name').textContent = name;
        document.getElementById('modal-tags').innerHTML = tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('');
        document.getElementById('modal-address').textContent = ent.enterpriseAddress || '-';
        document.getElementById('modal-phone').textContent = ent.enterprisePhone || '-';
        document.getElementById('modal-email').textContent = ent.enterpriseContactEmail || '-';
        document.getElementById('modal-website').textContent = ent.enterpriseWebsite || '-';
        var descEl = document.getElementById('modal-description');
        var descToggle = document.getElementById('modal-description-toggle');
        descEl.innerHTML = escapeHtml(ent.enterpriseIntroduction || '暂无介绍').replace(/\n/g, '<br>');
        // 长文本展开/收起功能
        var lineHeight = parseInt(getComputedStyle(descEl).lineHeight) || 28;
        var maxHeight = lineHeight * 3; // 约3行
        descEl.classList.remove('collapsed');
        descToggle.style.display = 'none';
        if (descEl.scrollHeight > maxHeight) {
            descEl.classList.add('collapsed');
            descToggle.style.display = 'inline-block';
            descToggle.onclick = function() {
                if (descEl.classList.contains('collapsed')) {
                    descEl.classList.remove('collapsed');
                    descToggle.textContent = '收起';
                } else {
                    descEl.classList.add('collapsed');
                    descToggle.textContent = '展开全文';
                }
            };
        }
        document.getElementById('modal-certificates').innerHTML = certs.length
            ? certs.map(function (c) { return '<div class="certificate-item"><i class="bi bi-check-circle-fill"></i><span>' + escapeHtml(c) + '</span></div>'; }).join('')
            : '<p>暂无认证信息</p>';
        document.getElementById('enterprise-modal').style.display = 'block';
    }

    // 调试按钮仅本地开发环境显示
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = "显示调试信息";
    debugBtn.style.position = "fixed";
    debugBtn.style.bottom = "20px";
    debugBtn.style.right = "20px";
    debugBtn.style.zIndex = "1000";
    debugBtn.style.padding = "10px";
    debugBtn.style.backgroundColor = "#4a6bdf";
    debugBtn.style.color = "white";
    debugBtn.style.border = "none";
    debugBtn.style.borderRadius = "4px";
    debugBtn.style.cursor = "pointer";

    debugBtn.addEventListener('click', function () {
        const debugInfo = document.getElementById('debug-info');
        const debugContent = document.getElementById('debug-content');

        // 收集调试信息
        let info = "";
        info += "<p><strong>当前页面:</strong> " + currentPage + "</p>";

        // 企业卡片信息
        const enterpriseCards = document.querySelectorAll('.enterprise-card');
        let pageInfo = {};
        enterpriseCards.forEach(card => {
            const pageNum = card.getAttribute('data-page');
            const display = card.style.display;
            if (!pageInfo[pageNum]) {
                pageInfo[pageNum] = { total: 0, visible: 0 };
            }
            pageInfo[pageNum].total++;
            if (display === 'block') {
                pageInfo[pageNum].visible++;
            }
        });

        info += "<p><strong>各页面卡片数量:</strong></p><ul>";
        for (const page in pageInfo) {
            info += `<li>第${page}页: 共${pageInfo[page].total}张卡片, 可见${pageInfo[page].visible}张</li>`;
        }
        info += "</ul>";

        // 显示调试信息
        debugContent.innerHTML = info;
        debugInfo.style.display = 'block';
    });

    document.body.appendChild(debugBtn);
    } // end localhost check
});