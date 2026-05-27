document.addEventListener('DOMContentLoaded', function () {
    // 认证类接口基址（/api/auth），供购物车、下单等使用；子函数内若未再声明 API_BASE 则继承此变量
    var API_BASE = window.ZhiliApi.apiAuth();

    // 根据用户类型显示/隐藏「我的店铺」按钮：仅企业用户可见，点击跳转我的店铺页面
    var userInfoStr = localStorage.getItem('userInfo');
    var userInfo = null;
    try { if (userInfoStr) userInfo = JSON.parse(userInfoStr); } catch (e) {}
    var isEnterprise = userInfo && userInfo.userType === 2;
    var myShopEl = document.querySelector('.product-categories .my-shop-category');
    if (myShopEl) {
        myShopEl.style.display = isEnterprise ? '' : 'none';
    }

    // 全局筛选状态对象
    window.filterState = {
        category: "全部产品",
        ageRange: "全部",
        season: "全部",
        priceRange: "全部",
        material: "全部",
        certification: "全部",
        sortMethod: "recommend"
    };

    // 全局购物车数据
    window.cartItems = [];

    // 原始产品数据备份
    window.originalProductData = [];

    /** 将后端 ProductVO 转为前端卡片所需格式（供 initProductData 与 handleMyShopClick 共用） */
    function mapProductFromApi(item) {
        var badgeObj = null;
        if (item.badge) {
            var badgeTextMap = { 'new': '新品', 'hot': '热销', 'organic': '有机', 'discount': '特惠' };
            badgeObj = { type: item.badge, text: badgeTextMap[item.badge] || item.badge };
        }
        var priceStr = function (n) {
            if (n == null) return '¥0.00';
            return '¥' + (typeof n === 'number' ? n.toFixed(2) : Number(n).toFixed(2));
        };
        var cat = item.category || '';
        var catStr = cat ? ('全部产品,' + (cat.indexOf('全部产品') >= 0 ? cat : cat)) : '全部产品';
        return {
            id: item.id,
            title: item.name,
            description: item.description || '',
            price: { current: priceStr(item.price), original: priceStr(item.originalPrice) },
            sales: item.sales != null ? item.sales : 0,
            company: item.enterpriseName || '',
            image: item.imageUrl || '',
            badge: badgeObj,
            category: catStr,
            ageRange: item.ageRange || '全部',
            season: item.season || '全部',
            material: item.material || '',
            certification: item.certification || ''
        };
    }

    // 从后端接口加载产品数据，完成后初始化分页等
    initProductData();

    // 产品分类切换
    const categories = document.querySelectorAll('.product-categories .category');

    categories.forEach(category => {
        category.addEventListener('click', function () {
            // 获取分类名称
            const categoryName = this.querySelector('span').textContent;

            // 我的店铺：跳转到我的店铺页面（仅企业用户可见该按钮）
            if (categoryName === '我的店铺') {
                handleMyShopClick();
                return;
            }

            // 移除所有分类的active类
            categories.forEach(cat => cat.classList.remove('active'));

            // 添加当前点击分类的active类
            this.classList.add('active');

            // 更新筛选状态
            window.filterState.category = categoryName;

            // 筛选产品
            applyFilters();
        });
    });

    // 处理我的店铺点击：跳转到我的店铺页面
    function handleMyShopClick() {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('请先登录后查看我的店铺', 'warning');
            var loginUrl = window.location.pathname.indexOf('pages') >= 0 ? 'login.html' : 'pages/login.html';
            window.location.href = loginUrl + '?redirect=my-shop.html';
            return;
        }
        window.location.href = 'my-shop.html';
    }

    // 筛选选项点击
    const filterOptions = document.querySelectorAll('.filter-option');

    filterOptions.forEach(option => {
        option.addEventListener('click', function () {
            // 获取当前选项所在的筛选组
            const filterGroup = this.parentElement;

            // 移除该组内其他选项的active类
            filterGroup.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));

            // 添加当前选项的active类
            this.classList.add('active');

            // 更新筛选状态
            const filterType = this.parentElement.previousElementSibling.textContent.replace('：', '');
            const filterValue = this.textContent;

            switch (filterType) {
                case '年龄段':
                    window.filterState.ageRange = filterValue;
                    break;
                case '季节':
                    window.filterState.season = filterValue;
                    break;
                case '价格':
                    window.filterState.priceRange = filterValue;
                    break;
                case '材质':
                    window.filterState.material = filterValue;
                    break;
                case '认证':
                    window.filterState.certification = filterValue;
                    break;
            }

            // 应用所有筛选条件
            applyFilters();
        });
    });

    // 排序选择
    const sortSelect = document.getElementById('product-sort');

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            // 获取排序方式
            const sortMethod = this.value;

            // 更新筛选状态
            window.filterState.sortMethod = sortMethod;
            
            // 应用排序
            applyFilters();
        });
    }

    // 搜索功能
    const searchBox = document.querySelector('.search-box');

    if (searchBox) {
        searchBox.querySelector('button').addEventListener('click', function (e) {
            e.preventDefault();

            // 获取搜索关键词
            const keyword = searchBox.querySelector('input').value.trim();

            if (keyword) {
                // 执行搜索
                searchProducts(keyword);
            } else {
                showNotification('请输入搜索关键词', 'warning');
            }
        });
        
        // 回车键搜索
        searchBox.querySelector('input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const keyword = this.value.trim();
                if (keyword) {
                    searchProducts(keyword);
                } else {
                    showNotification('请输入搜索关键词', 'warning');
                }
            }
        });
    }
    
    // 应用所有筛选条件并更新显示
    function applyFilters() {
        if (!window.originalProductData || window.originalProductData.length === 0) {
            return;
        }
        showNotification('正在应用筛选条件...', 'info');
        
        // 重置产品数据为原始数据
        window.productData = [...window.originalProductData];
        
        // 应用类别筛选
        if (window.filterState.category !== "全部产品") {
            window.productData = window.productData.filter(product => 
                product.category.includes(window.filterState.category));
        }
        
        // 应用年龄段筛选
        if (window.filterState.ageRange !== "全部") {
            window.productData = window.productData.filter(product => {
                // 检查产品年龄段是否包含或匹配所选年龄段
                if (!product.ageRange) return false;
                return product.ageRange.includes(window.filterState.ageRange) || 
                       product.ageRange === "全部";
            });
        }
        
        // 应用季节筛选（季节为「全部」的产品在任何季节下都显示）
        if (window.filterState.season !== "全部") {
            window.productData = window.productData.filter(product => {
                if (!product.season) return false;
                return product.season.includes(window.filterState.season) || product.season === "全部";
            });
        }
        
        // 应用价格筛选
        if (window.filterState.priceRange !== "全部") {
            window.productData = window.productData.filter(product => {
                const price = parseFloat(product.price.current.replace('¥', ''));
                
                switch (window.filterState.priceRange) {
                    case '50元以下':
                        return price < 50;
                    case '50-100元':
                        return price >= 50 && price <= 100;
                    case '100-200元':
                        return price > 100 && price <= 200;
                    case '200-500元':
                        return price > 200 && price <= 500;
                    case '500元以上':
                        return price > 500;
                    default:
                        return true;
                }
            });
        }
        
        // 应用材质筛选
        if (window.filterState.material !== "全部") {
            window.productData = window.productData.filter(product => {
                if (!product.material) return false;
                return product.material === window.filterState.material;
            });
        }
        
        // 应用认证筛选
        if (window.filterState.certification !== "全部") {
            window.productData = window.productData.filter(product => {
                if (!product.certification) return false;
                return product.certification.includes(window.filterState.certification);
            });
        }
        
        // 应用排序
        applySorting(window.filterState.sortMethod);
        
        // 更新页面显示
        const productList = document.querySelector('.product-list');
        const paginationEl = document.querySelector('.pagination');
        if (window.productData.length > 0) {
            if (paginationEl) paginationEl.style.display = 'flex';
            showPage(1);
            showNotification(`找到${window.productData.length}个符合条件的产品`, 'success');
        } else {
            if (productList) productList.innerHTML = '<div class="no-results">没有找到符合条件的产品，请尝试其他筛选条件</div>';
            showNotification('没有找到符合条件的产品', 'warning');
            if (paginationEl) paginationEl.style.display = 'none';
        }
    }
    
    // 应用排序
    function applySorting(sortMethod) {
        switch (sortMethod) {
            case 'price-asc':
                window.productData.sort((a, b) => {
                    const priceA = parseFloat(a.price.current.replace('¥', ''));
                    const priceB = parseFloat(b.price.current.replace('¥', ''));
                    return priceA - priceB;
                });
                break;
            case 'price-desc':
                window.productData.sort((a, b) => {
                    const priceA = parseFloat(a.price.current.replace('¥', ''));
                    const priceB = parseFloat(b.price.current.replace('¥', ''));
                    return priceB - priceA;
                });
                break;
            case 'sales':
                window.productData.sort((a, b) => b.sales - a.sales);
                break;
            case 'new':
                // 这里我们假设新品都有new标签
                window.productData.sort((a, b) => {
                    if (a.badge && a.badge.type === 'new') return -1;
                    if (b.badge && b.badge.type === 'new') return 1;
                    return 0;
                });
                break;
            case 'recommend':
            default:
                // 默认排序保持原样，假设原始数据已经是按推荐排序的
                break;
        }
    }
    
    // 搜索产品
    function searchProducts(keyword) {
        if (!window.originalProductData || window.originalProductData.length === 0) {
            showNotification('产品数据加载中，请稍后再试', 'warning');
            return;
        }
        showNotification(`正在搜索"${keyword}"...`, 'info');
        
        // 重置产品数据为原始数据
        window.productData = [...window.originalProductData];
        
        // 执行搜索过滤
        window.productData = window.productData.filter(product => {
            return product.title.includes(keyword) || 
                   product.description.includes(keyword) ||
                   product.company.includes(keyword) ||
                   product.category.includes(keyword) ||
                   (product.material && product.material.includes(keyword));
        });
        
        // 更新页面显示
        const productList = document.querySelector('.product-list');
        const paginationEl = document.querySelector('.pagination');
        if (window.productData.length > 0) {
            if (paginationEl) paginationEl.style.display = 'flex';
            showPage(1);
            showNotification(`找到${window.productData.length}个与"${keyword}"相关的产品`, 'success');
        } else {
            if (productList) productList.innerHTML = '<div class="no-results">没有找到与"' + keyword + '"相关的产品</div>';
            showNotification(`未找到与"${keyword}"相关的产品`, 'warning');
            if (paginationEl) paginationEl.style.display = 'none';
        }
    }
    
    // 重置所有筛选条件
    function resetFilters() {
        // 重置筛选状态
        window.filterState = {
            category: "全部产品",
            ageRange: "全部",
            season: "全部",
            priceRange: "全部",
            material: "全部",
            certification: "全部",
            sortMethod: "recommend"
        };
        
        // 重置UI状态
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
            if (cat.querySelector('span').textContent === "全部产品") {
                cat.classList.add('active');
            }
        });
        
        document.querySelectorAll('.filter-options').forEach(group => {
            group.querySelectorAll('.filter-option').forEach((opt, index) => {
                opt.classList.remove('active');
                if (index === 0) opt.classList.add('active'); // 第一个选项是"全部"
            });
        });
        
        // 重置排序选择
        if (document.getElementById('product-sort')) {
            document.getElementById('product-sort').value = 'recommend';
        }
        
        // 清空搜索框
        var searchInput = document.querySelector('.search-box input');
        if (searchInput) searchInput.value = '';
        
        // 重置产品数据
        window.productData = [...window.originalProductData];
        
        // 更新显示
        showPage(1);
        
        // 显示分页
        document.querySelector('.pagination').style.display = 'flex';
        
        showNotification('已重置所有筛选条件', 'success');
    }
    
    // 将重置筛选函数暴露给全局，以便可以从UI调用
    window.resetProductFilters = resetFilters;

    // ===== 产品分页功能 =====
    function initPagination() {
        let currentPage = 1;
        const totalPages = Math.ceil(productData.length / 6); // 每页6个产品

        // 获取分页按钮
        const pageLinks = document.querySelectorAll('.pagination a');

        // 初始化页面显示
        showPage(currentPage);

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
    }

    // 显示指定页面的产品卡片
    function showPage(pageNum) {
        console.log("显示产品页面:", pageNum);

        // 1. 更新分页按钮状态
        const pageLinks = document.querySelectorAll('.pagination a');
        const totalPages = Math.ceil(productData.length / 6); // 每页6个产品

        pageLinks.forEach(link => {
            const linkPage = link.getAttribute('data-page');

            // 移除所有active类
            link.classList.remove('active');

            // 设置当前页为active
            if (linkPage == pageNum) {
                link.classList.add('active');
            }

            // 处理上一页和下一页按钮
            if (linkPage === 'prev') {
                if (pageNum <= 1) {
                    link.classList.add('disabled');
                } else {
                    link.classList.remove('disabled');
                }
            } else if (linkPage === 'next') {
                if (pageNum >= totalPages) {
                    link.classList.add('disabled');
                } else {
                    link.classList.remove('disabled');
                }
            }
        });

        // 2. 计算当前页的产品索引范围
        const startIndex = (pageNum - 1) * 6;
        const endIndex = Math.min(startIndex + 6, productData.length);

        // 3. 清空产品列表
        const productList = document.querySelector('.product-list');
        productList.innerHTML = '';

        // 4. 添加当前页的产品
        for (let i = startIndex; i < endIndex; i++) {
            const product = productData[i];

            // 创建产品卡片元素
            const productCard = createProductCard(product);

            // 将产品卡片添加到产品列表
            productList.appendChild(productCard);
        }

        // 5. 重新绑定产品卡片事件
        initProductCardEvents();

        console.log(`第${pageNum}页显示了${endIndex - startIndex}个产品`);
    }

    // 创建产品卡片HTML元素
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        // 存储产品ID供加入购物车使用
        if (product.id) card.dataset.productId = product.id;

        // 添加徽章
        if (product.badge) {
            const badge = document.createElement('div');
            badge.className = `product-badge ${product.badge.type}`;
            badge.textContent = product.badge.text;
            card.appendChild(badge);
        }

        // 添加产品图片
        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image';
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.title;
        imageContainer.appendChild(image);
        card.appendChild(imageContainer);

        // 添加产品信息
        const infoContainer = document.createElement('div');
        infoContainer.className = 'product-info';

        // 产品标题
        const title = document.createElement('h3');
        title.textContent = product.title;
        infoContainer.appendChild(title);

        // 产品描述
        const description = document.createElement('p');
        description.className = 'product-desc';
        description.textContent = product.description;
        infoContainer.appendChild(description);

        // 价格和销量
        const meta = document.createElement('div');
        meta.className = 'product-meta';

        const price = document.createElement('div');
        price.className = 'product-price';

        const currentPrice = document.createElement('span');
        currentPrice.className = 'price-current';
        currentPrice.textContent = product.price.current;
        price.appendChild(currentPrice);

        const originalPrice = document.createElement('span');
        originalPrice.className = 'price-original';
        originalPrice.textContent = product.price.original;
        price.appendChild(originalPrice);

        meta.appendChild(price);

        const sales = document.createElement('div');
        sales.className = 'product-sales';
        sales.textContent = `月销 ${product.sales}件`;
        meta.appendChild(sales);

        infoContainer.appendChild(meta);

        // 企业信息和操作按钮
        const footer = document.createElement('div');
        footer.className = 'product-footer';

        const company = document.createElement('div');
        company.className = 'product-company';
        company.textContent = product.company;
        footer.appendChild(company);

        const actions = document.createElement('div');
        actions.className = 'product-actions';

        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'btn-outline btn-sm';
        addToCartBtn.innerHTML = '<i class="bi bi-cart-plus"></i> 加入购物车';
        actions.appendChild(addToCartBtn);

        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'btn-icon btn-sm';
        favoriteBtn.innerHTML = '<i class="bi bi-heart"></i>';
        actions.appendChild(favoriteBtn);

        footer.appendChild(actions);
        infoContainer.appendChild(footer);

        card.appendChild(infoContainer);

        return card;
    }

    // 初始化产品卡片事件
    function initProductCardEvents() {
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            // 给产品图片添加点击事件，打开产品预览模态框
            card.querySelector('.product-image').addEventListener('click', function () {
                openProductPreview(card);
            });

            // 给产品标题添加点击事件，打开产品预览模态框
            card.querySelector('h3').addEventListener('click', function () {
                openProductPreview(card);
            });

            // 给加入购物车按钮添加点击事件
            const addToCartBtn = card.querySelector('.btn-outline');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); // 阻止事件冒泡

                    // 获取产品信息
                    const productId = card.dataset.productId;
                    const productTitle = card.querySelector('h3').textContent;
                    const productImage = card.querySelector('.product-image img').src;

                    // 加入购物车（带产品ID）
                    addToCart(productId, productTitle, productImage, null, null, 1);
                });
            }

            // 给收藏按钮添加点击事件
            const favoriteBtn = card.querySelector('.btn-icon');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); // 阻止事件冒泡

                    // 切换收藏状态
                    this.classList.toggle('favorited');

                    if (this.classList.contains('favorited')) {
                        this.style.color = '#f44336';
                        this.style.borderColor = '#f44336';

                        // 获取产品信息
                        const productTitle = card.querySelector('h3').textContent;

                        // 显示收藏成功提示
                        showNotification(`已收藏商品：${productTitle}`, 'success');
                    } else {
                        this.style.color = '';
                        this.style.borderColor = '';
                    }
                });
            }
        });
    }

    // ===== 初始化产品数据（从后端接口加载，图片使用数据库中的 OSS URL） =====
    function initProductData() {
        var productListEl = document.querySelector('.product-list');
        if (productListEl) {
            productListEl.innerHTML = '<div class="no-results" style="padding:40px;text-align:center;color:#999;">加载产品中...</div>';
        }

        var API_BASE = window.ZhiliApi.apiRoot();

        fetch(API_BASE + '/products')
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result && result.code === 200 && Array.isArray(result.data)) {
                    window.productData = result.data.map(mapProductFromApi);
                    window.originalProductData = [...window.productData];
                    console.log('产品数据从接口加载完成，共' + window.productData.length + '个产品');
                } else {
                    window.productData = [];
                    window.originalProductData = [];
                    console.warn('接口未返回产品数据，使用空列表');
                }
                afterProductDataReady();
            })
            .catch(function (err) {
                console.warn('加载产品接口失败，使用空列表', err);
                window.productData = [];
                window.originalProductData = [];
                afterProductDataReady();
            });

        /** 产品数据就绪后：初始化分页、模态框、购物车 */
        function afterProductDataReady() {
            initPagination();
            initProductModal();
            initCartIcon();
        }
    }

    // 初始化产品预览模态框
    function initProductModal() {
        const modal = document.getElementById('productPreviewModal');

        if (modal) {
            // 关闭模态框
            const closeModal = modal.querySelector('.close-modal');
            if (closeModal) {
                closeModal.addEventListener('click', function () {
                    modal.classList.remove('show');
                });
            }

            // ESC键关闭模态框
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    modal.classList.remove('show');
                }
            });

            // 颜色和尺码选项点击
            const options = modal.querySelectorAll('.select-options .option');
            options.forEach(option => {
                option.addEventListener('click', function () {
                    // 获取当前选项组
                    const optionGroup = this.parentElement;

                    // 移除该组内其他选项的active类
                    optionGroup.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));

                    // 添加当前选项的active类
                    this.classList.add('active');
                });
            });

            // 数量增减
            const quantityDecrease = modal.querySelector('#qtyDecrease');
            const quantityIncrease = modal.querySelector('#qtyIncrease');
            const quantityInput = modal.querySelector('#qtyInput');

            if (quantityDecrease) {
                quantityDecrease.addEventListener('click', function () {
                    let currentValue = parseInt(quantityInput.value);
                    if (currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                    }
                });
            }

            if (quantityIncrease) {
                quantityIncrease.addEventListener('click', function () {
                    let currentValue = parseInt(quantityInput.value);
                    const maxValue = parseInt(quantityInput.getAttribute('max') || '99');
                    if (currentValue < maxValue) {
                        quantityInput.value = currentValue + 1;
                    } else {
                        showNotification('已达到最大购买数量', 'warning');
                    }
                });
            }

            // 加入购物车按钮
            const addToCartBtn = modal.querySelector('#btnAddToCart');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', function () {
                    // 获取商品信息
                    const productId = modal.dataset.productId;
                    const productTitle = modal.querySelector('#previewTitle')?.textContent || '';
                    const selectedColor = modal.querySelector('#colorOptions .option.active')?.textContent || '';
                    const selectedSize = modal.querySelector('#sizeOptions .option.active')?.textContent || '';
                    const quantity = parseInt(document.getElementById('qtyInput')?.value) || 1;
                    const productImage = modal.querySelector('#previewMainImage')?.src || '';

                    // 调用加入购物车
                    addToCart(productId, productTitle, productImage, selectedColor, selectedSize, quantity);

                    // 显示添加成功动画
                    addToCartAnimation(this);
                });
            }

            // 立即购买按钮
            const buyNowBtn = modal.querySelector('#btnBuyNow');
            if (buyNowBtn) {
                buyNowBtn.addEventListener('click', function () {
                    const productTitle = modal.querySelector('#previewTitle')?.textContent || '';
                    const selectedColor = modal.querySelector('#colorOptions .option.active')?.textContent || '';
                    const selectedSize = modal.querySelector('#sizeOptions .option.active')?.textContent || '';
                    const quantity = document.getElementById('qtyInput')?.value || '1';
                    const productImage = modal.querySelector('#previewMainImage')?.src || '';

                    // 立即购买
                    simulateBuyNow(productTitle, selectedColor, selectedSize, quantity, productImage);
                });
            }

            // 收藏按钮
            const favoriteBtn = modal.querySelector('.btn-icon');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', function () {
                    this.classList.toggle('favorited');

                    if (this.classList.contains('favorited')) {
                        this.querySelector('i').classList.remove('bi-heart');
                        this.querySelector('i').classList.add('bi-heart-fill');
                        this.style.color = '#f44336';

                        const productTitle = modal.querySelector('.preview-details h2').textContent;
                        showNotification(`已收藏商品：${productTitle}`, 'success');
                    } else {
                        this.querySelector('i').classList.remove('bi-heart-fill');
                        this.querySelector('i').classList.add('bi-heart');
                        this.style.color = '';

                        const productTitle = modal.querySelector('.preview-details h2').textContent;
                        showNotification(`已取消收藏：${productTitle}`, 'info');
                    }
                });
            }

            console.log('产品预览模态框初始化完成');
        }
    }

    // 打开产品预览模态框
    function openProductPreview(productCard) {
        const productId = productCard.dataset.productId;
        const productTitle = productCard.querySelector('h3').textContent;
        const productImage = productCard.querySelector('.product-image img').src.replace('300x400', '600x800');
        const productPrice = productCard.querySelector('.price-current').textContent;
        const productOriginalPrice = productCard.querySelector('.price-original').textContent;

        const modal = document.getElementById('productPreviewModal');

        if (modal) {
            modal.dataset.productId = productId || '';
            modal.querySelector('#previewTitle').textContent = productTitle;
            modal.querySelector('#previewMainImage').src = productImage;
            modal.querySelector('#previewPrice').textContent = productPrice;
            modal.querySelector('#previewOriginalPrice').textContent = productOriginalPrice;

            // 计算折扣
            const currentPrice = parseFloat(productPrice.replace('¥', ''));
            const originalPrice = parseFloat(productOriginalPrice.replace('¥', ''));
            if (!isNaN(currentPrice) && !isNaN(originalPrice) && originalPrice > 0) {
                const discount = Math.round((currentPrice / originalPrice) * 10);
                modal.querySelector('#previewDiscount').textContent = discount + '折';
            }

            // 从后端获取产品详情（含库存）
            const API_ROOT = window.ZhiliApi.apiRoot();
            fetch(API_ROOT + '/products/' + productId)
                .then(function(res) { return res.json(); })
                .then(function(result) {
                    if (result.code === 200 && result.data) {
                        const p = result.data;
                        document.getElementById('previewProductId').textContent = p.id || '';
                        document.getElementById('previewAge').textContent = p.ageRange || '';
                        document.getElementById('previewMaterial').textContent = p.material || '';
                        document.getElementById('previewSeason').textContent = p.season || '';
                        document.getElementById('previewCert').textContent = p.certification || '';
                        document.getElementById('previewStock').textContent = '库存 ' + (p.stock != null ? p.stock : 0) + ' 件';
                        if (p.enterpriseName) {
                            document.getElementById('companyName').textContent = p.enterpriseName;
                        }
                    }
                })
                .catch(function(err) {
                    console.warn('获取产品详情失败', err);
                });

            modal.classList.add('show');
        }
    }

    // 模拟按分类筛选产品
    function simulateFilterByCategory(categoryName) {
        console.log(`按分类筛选: ${categoryName}`);

        // 显示通知
        showNotification(`正在加载${categoryName}分类的产品...`, 'info');

        // 在实际应用中，这里会发送AJAX请求到服务器获取筛选结果
        // 这里仅作为演示，模拟筛选过程

        // 筛选产品并重置显示
        setTimeout(() => {
            // 重新渲染产品列表
            showPage(1);
            showNotification(`已加载${categoryName}的产品`, 'success');
        }, 500);
    }

    // 模拟按选项筛选产品
    function simulateFilterByOption(filterType, filterValue) {
        console.log(`按${filterType}筛选: ${filterValue}`);

        // 显示通知
        showNotification(`正在筛选${filterType}: ${filterValue}的产品...`, 'info');

        // 在实际应用中，这里会发送AJAX请求到服务器获取筛选结果
        // 这里仅作为演示，模拟筛选过程

        // 筛选产品并重置显示
        setTimeout(() => {
            // 重新渲染产品列表
            showPage(1);
            showNotification(`已筛选${filterType}: ${filterValue}的产品`, 'success');
        }, 500);
    }

    // 模拟产品排序
    function simulateSortProducts(sortMethod) {
        console.log(`按${sortMethod}排序`);

        // 显示通知
        let sortText = '';
        switch (sortMethod) {
            case 'recommend': sortText = '推荐排序'; break;
            case 'new': sortText = '最新上架'; break;
            case 'price-asc': sortText = '价格从低到高'; break;
            case 'price-desc': sortText = '价格从高到低'; break;
            case 'sales': sortText = '销量优先'; break;
        }

        showNotification(`正在${sortText}...`, 'info');

        // 在实际应用中，这里会发送AJAX请求到服务器获取排序结果
        // 这里仅作为演示，模拟排序过程
        setTimeout(() => {
            // 重新渲染产品列表
            if (sortMethod === 'price-asc') {
                // 模拟按价格从低到高排序
                productData.sort((a, b) => {
                    const priceA = parseFloat(a.price.current.replace('¥', ''));
                    const priceB = parseFloat(b.price.current.replace('¥', ''));
                    return priceA - priceB;
                });
            } else if (sortMethod === 'price-desc') {
                // 模拟按价格从高到低排序
                productData.sort((a, b) => {
                    const priceA = parseFloat(a.price.current.replace('¥', ''));
                    const priceB = parseFloat(b.price.current.replace('¥', ''));
                    return priceB - priceA;
                });
            } else if (sortMethod === 'sales') {
                // 模拟按销量排序
                productData.sort((a, b) => b.sales - a.sales);
            }

            showPage(1);
            showNotification(`已完成${sortText}`, 'success');
        }, 500);
    }

    // 模拟搜索产品
    function simulateSearchProducts(keyword) {
        console.log(`搜索关键词: ${keyword}`);

        // 显示通知
        showNotification(`正在搜索"${keyword}"...`, 'info');

        // 在实际应用中，这里会发送AJAX请求到服务器获取搜索结果
        // 这里仅作为演示，模拟搜索过程
        setTimeout(() => {
            // 模拟搜索结果
            const searchResults = productData.filter(product => {
                return product.title.includes(keyword) || 
                       product.description.includes(keyword) ||
                       product.company.includes(keyword) ||
                       product.category.includes(keyword);
            });

            if (searchResults.length > 0) {
                // 临时替换产品数据进行展示
                const originalData = [...productData];
                window.productData = searchResults;
                
                showPage(1);
                
                // 恢复原始数据
                setTimeout(() => {
                    window.productData = originalData;
                }, 5000);

                showNotification(`找到${searchResults.length}个与"${keyword}"相关的产品`, 'success');
            } else {
                showNotification(`未找到与"${keyword}"相关的产品`, 'warning');
            }
        }, 800);
    }

    // 加入购物车（调用后端接口）
    function addToCart(productId, productTitle, productImage, color, size, quantity) {
        // 检查登录状态
        var token = localStorage.getItem('token');
        if (!token) {
            showNotification('请先登录后加入购物车', 'warning');
            // 跳转登录页
            var loginUrl = window.location.pathname.indexOf('pages') >= 0 ? 'login.html' : 'pages/login.html';
            window.location.href = loginUrl;
            return;
        }

        if (!productId) {
            showNotification('产品信息不完整', 'error');
            return;
        }

        // 调用后端加入购物车接口
        var API_BASE = window.ZhiliApi.apiAuth();

        var btnText = color ? (' ' + (quantity || 1) + '件 ' + (color || '') + ' ' + (size || '') + ' ') : '';
        
        fetch(API_BASE + '/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                productId: productId,
                selectedColor: color || null,
                selectedSize: size || null,
                quantity: quantity || 1
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.code === 200) {
                // 成功后从接口获取最新购物车数量
                fetchCartCount();
                // 同时更新本地购物车数据（含 productId，供结算时使用）
                window.cartItems.push({
                    id: Date.now().toString(),
                    productId: productId,
                    name: productTitle,
                    image: productImage,
                    color: color || '默认',
                    size: size || '默认',
                    price: 0,
                    quantity: quantity || 1
                });
                showNotification('已加入购物车' + btnText, 'success');
                // 同步刷新全局导航栏购物车角标
                if (window.refreshCartBadge) { window.refreshCartBadge(); }
            } else {
                showNotification(data.message || '加入购物车失败', 'error');
            }
        })
        .catch(function(err) {
            console.error('加入购物车失败:', err);
            showNotification('网络错误，请稍后重试', 'error');
        });
    }

    // 获取购物车数量并更新角标
    function fetchCartCount() {
        var token = localStorage.getItem('token');
        if (!token) return;

        var API_BASE = window.ZhiliApi.apiAuth();

        fetch(API_BASE + '/cart/count', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.code === 200 && data.data != null) {
                updateCartIcon(data.data, true); // true = 设为绝对值，不从当前数量累加
            }
        })
        .catch(function() {});
    }

    // 页面加载时获取购物车数量
    (function initCartCountOnLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fetchCartCount);
        } else {
            fetchCartCount();
        }
    })();

    // 模拟立即购买
    function simulateBuyNow(productTitle, color, size, quantity, imageUrl) {
        console.log(`立即购买: ${productTitle}, 颜色: ${color}, 尺码: ${size}, 数量: ${quantity}`);
        showNotification(`正在跳转到结算页面...`, 'info');

        // 模拟跳转到结算页面
        setTimeout(() => {
            // 创建结算页面模态框
            showCheckoutModal(productTitle, color, size, quantity, imageUrl);
        }, 1000);
    }

    // 更新购物车图标（仅更新数量，不创建新图标；图标由 initCartIcon 统一创建）
    function updateCartIcon(count) {
        var cartIcon = document.querySelector('.user-info .cart-icon');
        if (!cartIcon) return; // 图标不存在时跳过，避免重复创建

        var countElement = cartIcon.querySelector('.cart-count');
        if (!countElement) return;
        var setAbsolute = arguments[1] === true;
        var currentCount = parseInt(countElement.textContent, 10) || 0;
        countElement.textContent = setAbsolute ? Math.max(0, count) : (currentCount + count);

        cartIcon.classList.add('shake');
        setTimeout(function() { cartIcon.classList.remove('shake'); }, 500);
    }

    // 添加到购物车的动画效果
    function addToCartAnimation(button) {
        // 创建一个飞向购物车的元素
        const flyElement = document.createElement('div');
        flyElement.className = 'fly-to-cart';
        flyElement.innerHTML = '<i class="bi bi-cart-plus"></i>';

        // 获取按钮位置
        const buttonRect = button.getBoundingClientRect();

        // 设置初始位置
        flyElement.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
        flyElement.style.top = `${buttonRect.top + buttonRect.height / 2}px`;

        // 添加到页面
        document.body.appendChild(flyElement);

        // 获取购物车位置
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            const cartRect = cartIcon.getBoundingClientRect();

            // 设置动画终点
            setTimeout(() => {
                flyElement.style.left = `${cartRect.left + cartRect.width / 2}px`;
                flyElement.style.top = `${cartRect.top + cartRect.height / 2}px`;
                flyElement.style.opacity = '0';
                flyElement.style.transform = 'scale(0.3)';
            }, 10);

            // 动画结束后移除元素
            setTimeout(() => {
                document.body.removeChild(flyElement);
            }, 1000);
        } else {
            // 如果没有购物车图标，直接移除
            document.body.removeChild(flyElement);
        }
    }

    // 显示结算页面模态框
    function showCheckoutModal(productTitle, color, size, quantity, imageUrl) {
        // 创建模态框
        const checkoutModal = document.createElement('div');
        checkoutModal.className = 'checkout-modal';

        // 如果没有提供图片URL，尝试从产品预览模态框获取
        if (!imageUrl) {
            const previewModal = document.getElementById('productPreviewModal');
            if (previewModal && previewModal.querySelector('.gallery-main img')) {
                imageUrl = previewModal.querySelector('.gallery-main img').src;
            } else {
                // 默认图片
                imageUrl = "../images/products/boys/boys-tshirt-01.jpg";
            }
        }

        // 模拟订单信息
        let price = "¥99.00"; // 默认价格
        try {
            // 尝试获取当前产品的价格
            const priceElement = document.querySelector('#productPreviewModal .preview-price .price-current');
            if (priceElement) {
                price = priceElement.textContent;
            }
        } catch (e) {
            console.error("获取价格失败，使用默认价格", e);
        }

        const totalPrice = `¥${(parseFloat(price.replace('¥', '')) * parseInt(quantity || 1)).toFixed(2)}`;

        // 添加模态框内容
        checkoutModal.innerHTML = `
            <div class="checkout-content">
                <span class="close-modal"><i class="bi bi-x-lg"></i></span>
                <h2>确认订单</h2>
                <div class="checkout-info">
                    <div class="checkout-product">
                        <h3>商品信息</h3>
                        <div class="product-item">
                            <div class="item-image">
                                <img src="${imageUrl}" alt="${productTitle}">
                            </div>
                            <div class="item-info">
                                <h4>${productTitle}</h4>
                                <p>颜色：${color || '默认'} | 尺码：${size || '默认'}</p>
                                <p>数量：${quantity || 1}件 × ${price} = ${totalPrice}</p>
                            </div>
                        </div>
                    </div>
                    <div class="checkout-address">
                        <h3>收货地址</h3>
                        <div class="address-item">
                            <p><span>收货人：</span><input type="text" class="receiver-name" placeholder="请输入收货人姓名" value="张三"></p>
                            <p><span>手机号：</span><input type="tel" class="receiver-phone" placeholder="请输入手机号" value="13912345678"></p>
                            <p><span>收货地址：</span><input type="text" class="receiver-address" placeholder="请输入收货地址" value="浙江省湖州市织里镇"></p>
                        </div>
                    </div>
                    <div class="checkout-payment">
                        <h3>支付方式</h3>
                        <div class="payment-options">
                            <label class="payment-option active">
                                <input type="radio" name="payment" value="weixin" checked>
                                <span>微信支付</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment" value="alipay">
                                <span>支付宝</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment" value="bank">
                                <span>银行卡</span>
                            </label>
                        </div>
                    </div>
                    <div class="checkout-summary">
                        <div class="summary-item">
                            <span>商品金额：</span>
                            <span>${totalPrice}</span>
                        </div>
                        <div class="summary-item">
                            <span>运费：</span>
                            <span>¥0.00</span>
                        </div>
                        <div class="summary-item total">
                            <span>订单总计：</span>
                            <span>${totalPrice}</span>
                        </div>
                    </div>
                    <div class="checkout-actions">
                        <button class="btn-primary btn-lg confirm-order">确认支付</button>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .checkout-modal {
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .checkout-content {
                background-color: #fff;
                border-radius: 8px;
                width: 80%;
                max-width: 800px;
                padding: 20px;
                position: relative;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .checkout-content h2 {
                text-align: center;
                margin-bottom: 20px;
                color: #333;
            }
            
            .checkout-product, .checkout-address, .checkout-payment, .checkout-summary {
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 4px;
                background-color: #f9f9f9;
            }
            
            .product-item {
                display: flex;
                padding: 10px 0;
            }
            
            .item-image {
                width: 80px;
                height: 80px;
                margin-right: 15px;
            }
            
            .item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 4px;
            }
            
            .item-info h4 {
                margin: 0 0 5px 0;
                font-size: 16px;
            }
            
            .item-info p {
                margin: 5px 0;
                color: #666;
                font-size: 14px;
            }
            
            .checkout-address .address-item p {
                margin: 8px 0;
                font-size: 14px;
            }

            .checkout-address .address-item p span {
                color: #666;
                display: inline-block;
                width: 70px;
            }

            .checkout-address .address-item input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                width: 200px;
            }

            .checkout-address .address-item input:focus {
                outline: none;
                border-color: #4a6bdf;
            }
            
            .payment-options {
                display: flex;
                gap: 15px;
            }
            
            .payment-option {
                display: flex;
                align-items: center;
                padding: 8px 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .payment-option.active {
                border-color: #4a6bdf;
                background-color: #f0f4ff;
            }
            
            .payment-option input {
                margin-right: 5px;
            }
            
            .checkout-summary {
                border-top: 1px solid #eee;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
            }
            
            .summary-item.total {
                font-size: 18px;
                font-weight: bold;
                color: #e74c3c;
                border-top: 1px solid #eee;
                padding-top: 10px;
                margin-top: 10px;
            }
            
            .checkout-actions {
                text-align: center;
                margin-top: 20px;
            }
            
            .close-modal {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 24px;
                cursor: pointer;
                color: #999;
            }
            
            .close-modal:hover {
                color: #333;
            }
            
            /* 动画效果 */
            @keyframes flyToCart {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(0.3);
                    opacity: 0;
                }
            }
            
            .fly-to-cart {
                position: fixed;
                font-size: 24px;
                color: #4a6bdf;
                z-index: 2000;
                transition: all 1s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            }
            
            @keyframes shakeCart {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .cart-icon {
                position: relative;
                margin-right: 15px;
                cursor: pointer;
            }
            
            .cart-icon i {
                font-size: 20px;
                color: #4a6bdf;
            }
            
            .cart-count {
                position: absolute;
                top: -8px;
                right: -8px;
                background-color: #e74c3c;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .cart-icon.shake {
                animation: shakeCart 0.5s;
            }
            
            /* 模态框动画 */
            .checkout-modal {
                animation: fadeIn 0.3s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;

        // 添加到页面
        document.head.appendChild(style);
        document.body.appendChild(checkoutModal);

        // 添加关闭事件
        const closeBtn = checkoutModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', function () {
            document.body.removeChild(checkoutModal);
        });

        // 添加支付选项切换事件
        const paymentOptions = checkoutModal.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.addEventListener('click', function () {
                paymentOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                this.querySelector('input').checked = true;
            });
        });

        // 添加确认订单事件
        const confirmBtn = checkoutModal.querySelector('.confirm-order');
        confirmBtn.addEventListener('click', async function () {
            // 获取收货信息
            const receiverName = checkoutModal.querySelector('.receiver-name')?.value || checkoutModal.querySelector('.address-item p:nth-child(1) span:last-child')?.textContent || '张三';
            const receiverPhone = checkoutModal.querySelector('.receiver-phone')?.value || '13912345678';
            const receiverAddress = checkoutModal.querySelector('.receiver-address')?.value || checkoutModal.querySelector('.address-item p:nth-child(3) span:last-child')?.textContent || '浙江省湖州市织里镇';

            if (!receiverName || !receiverPhone || !receiverAddress) {
                showNotification('请填写完整的收货信息', 'error');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('请先登录', 'error');
                window.location.href = 'login.html?redirect=product.html';
                return;
            }

            // 构建订单数据
            const orderData = {
                receiverName: receiverName,
                receiverPhone: receiverPhone,
                receiverAddress: receiverAddress,
                items: [{
                    productId: window.currentCheckoutProductId || window.currentProductId,
                    selectedColor: color,
                    selectedSize: size,
                    quantity: parseInt(quantity) || 1
                }]
            };

            try {
                confirmBtn.textContent = '处理中...';
                confirmBtn.disabled = true;

                const response = await fetch(API_BASE + '/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (result.code === 200) {
                    document.body.removeChild(checkoutModal);
                    showNotification('订单创建成功！正在跳转到订单页面...', 'success');

                    // 刷新购物车数量
                    updateCartCount();

                    // 跳转到订单页面
                    setTimeout(() => {
                        window.location.href = 'orders.html';
                    }, 1500);
                } else {
                    showNotification(result.message || '创建订单失败', 'error');
                    confirmBtn.textContent = '确认支付';
                    confirmBtn.disabled = false;
                }
            } catch (error) {
                console.error('创建订单失败:', error);
                showNotification('创建订单失败，请稍后重试', 'error');
                confirmBtn.textContent = '确认支付';
                confirmBtn.disabled = false;
            }
        });
    }

    // 购物车结算 - 显示确认订单页面
    function showCheckoutModalForCart(productImage, totalAmount, discountAmount, payableAmount) {
        // 创建模态框
        const checkoutModal = document.createElement('div');
        checkoutModal.className = 'checkout-modal';

        // 生成购物车商品列表HTML
        let cartItemsHTML = '';
        window.cartItems.forEach((item, index) => {
            const itemSubtotal = item.price * item.quantity;
            cartItemsHTML += `
                <div class="product-item">
                    <div class="item-image">
                        <img src="${item.image || 'https://via.placeholder.com/80x80'}" alt="${item.name}">
                    </div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>颜色：${item.color || '默认'} | 尺码：${item.size || '默认'}</p>
                        <p>数量：${item.quantity}件 × ¥${item.price.toFixed(2)} = ¥${itemSubtotal.toFixed(2)}</p>
                    </div>
                </div>
            `;
        });

        checkoutModal.innerHTML = `
            <div class="checkout-content">
                <span class="close-modal"><i class="bi bi-x-lg"></i></span>
                <h2>确认订单</h2>
                <div class="checkout-info">
                    <div class="checkout-product">
                        <h3>商品信息 (${window.cartItems.length}件商品)</h3>
                        <div class="cart-items-list">
                            ${cartItemsHTML}
                        </div>
                    </div>
                    <div class="checkout-address">
                        <h3>收货地址</h3>
                        <div class="address-item">
                            <p><span>收货人：</span><input type="text" class="receiver-name" placeholder="请输入收货人姓名" value="张三"></p>
                            <p><span>手机号：</span><input type="tel" class="receiver-phone" placeholder="请输入手机号" value="13912345678"></p>
                            <p><span>收货地址：</span><input type="text" class="receiver-address" placeholder="请输入收货地址" value="浙江省湖州市织里镇"></p>
                        </div>
                    </div>
                    <div class="checkout-payment">
                        <h3>支付方式</h3>
                        <div class="payment-options">
                            <label class="payment-option active">
                                <input type="radio" name="payment" value="weixin" checked>
                                <span>微信支付</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment" value="alipay">
                                <span>支付宝</span>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="payment" value="bank">
                                <span>银行卡</span>
                            </label>
                        </div>
                    </div>
                    <div class="checkout-summary">
                        <div class="summary-item">
                            <span>商品金额：</span>
                            <span>¥${totalAmount.toFixed(2)}</span>
                        </div>
                        <div class="summary-item">
                            <span>优惠金额：</span>
                            <span>-¥${discountAmount.toFixed(2)}</span>
                        </div>
                        <div class="summary-item">
                            <span>运费：</span>
                            <span>¥0.00</span>
                        </div>
                        <div class="summary-item total">
                            <span>订单总计：</span>
                            <span>¥${payableAmount.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="checkout-actions">
                        <button class="btn-primary btn-lg confirm-order">确认支付</button>
                    </div>
                </div>
            </div>
        `;

        // 添加样式（复用已有的样式）
        const existingStyle = document.querySelector('.checkout-modal style');
        if (!existingStyle) {
            const style = document.createElement('style');
            style.textContent = `
                .checkout-modal {
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .checkout-content {
                    background-color: #fff;
                    border-radius: 8px;
                    width: 80%;
                    max-width: 800px;
                    padding: 20px;
                    position: relative;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .checkout-content h2 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .close-modal {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    font-size: 24px;
                    cursor: pointer;
                }
                .checkout-product, .checkout-address, .checkout-payment, .checkout-summary {
                    margin-bottom: 20px;
                }
                .checkout-product h3, .checkout-address h3, .checkout-payment h3 {
                    font-size: 16px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                .checkout-product .product-item {
                    display: flex;
                    gap: 15px;
                    padding: 10px 0;
                    border-bottom: 1px solid #f5f5f5;
                }
                .checkout-product .item-image img {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                .checkout-product .item-info h4 {
                    font-size: 14px;
                    margin: 0 0 5px 0;
                }
                .checkout-product .item-info p {
                    font-size: 12px;
                    color: #666;
                    margin: 2px 0;
                }
                .checkout-address .address-item p {
                    margin: 8px 0;
                }
                .checkout-address .address-item span {
                    display: inline-block;
                    width: 70px;
                }
                .checkout-address input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .payment-options {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .payment-option {
                    padding: 10px 20px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .payment-option.active {
                    border-color: #4CAF50;
                    background-color: #f0f9f0;
                }
                .checkout-summary .summary-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }
                .checkout-summary .total {
                    font-size: 18px;
                    font-weight: bold;
                    color: #f44336;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                    margin-top: 5px;
                }
                .checkout-actions {
                    text-align: center;
                    margin-top: 20px;
                }
                .confirm-order {
                    width: 100%;
                    padding: 12px;
                    font-size: 16px;
                }
                .cart-items-list {
                    max-height: 200px;
                    overflow-y: auto;
                }
            `;
            checkoutModal.appendChild(style);
        }

        // 添加到页面
        document.body.appendChild(checkoutModal);

        // 关闭按钮事件
        const closeBtn = checkoutModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', function () {
            document.body.removeChild(checkoutModal);
        });

        // 点击模态框外部关闭
        checkoutModal.addEventListener('click', function (event) {
            if (event.target === checkoutModal) {
                document.body.removeChild(checkoutModal);
            }
        });

        // 支付方式切换事件
        const paymentOptions = checkoutModal.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.addEventListener('click', function () {
                paymentOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                this.querySelector('input').checked = true;
            });
        });

        // 确认支付按钮事件
        const confirmBtn = checkoutModal.querySelector('.confirm-order');
        confirmBtn.addEventListener('click', async function () {
            // 获取收货信息
            const receiverName = checkoutModal.querySelector('.receiver-name')?.value || '张三';
            const receiverPhone = checkoutModal.querySelector('.receiver-phone')?.value || '13912345678';
            const receiverAddress = checkoutModal.querySelector('.receiver-address')?.value || '浙江省湖州市织里镇';

            if (!receiverName || !receiverPhone || !receiverAddress) {
                showNotification('请填写完整的收货信息', 'error');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('请先登录', 'error');
                window.location.href = 'login.html?redirect=product.html';
                return;
            }

            // 构建订单数据
            const orderData = {
                receiverName: receiverName,
                receiverPhone: receiverPhone,
                receiverAddress: receiverAddress,
                items: window.cartItems.map(item => ({
                    productId: item.productId || item.id,
                    selectedColor: item.color === '默认' ? null : item.color,
                    selectedSize: item.size === '默认' ? null : item.size,
                    quantity: item.quantity
                }))
            };

            try {
                confirmBtn.textContent = '处理中...';
                confirmBtn.disabled = true;

                const response = await fetch(API_BASE + '/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (result.code === 200) {
                    document.body.removeChild(checkoutModal);
                    showNotification('订单创建成功！正在跳转到订单页面...', 'success');

                    // 清空本地购物车数据
                    window.cartItems = [];

                    // 刷新购物车数量
                    updateCartCount();

                    // 跳转到订单页面
                    setTimeout(() => {
                        window.location.href = 'orders.html';
                    }, 1500);
                } else {
                    showNotification(result.message || '创建订单失败', 'error');
                    confirmBtn.textContent = '确认支付';
                    confirmBtn.disabled = false;
                }
            } catch (error) {
                console.error('创建订单失败:', error);
                showNotification('创建订单失败，请稍后重试', 'error');
                confirmBtn.textContent = '确认支付';
                confirmBtn.disabled = false;
            }
        });
    }

    // 显示通知
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // 添加到页面
        document.body.appendChild(notification);

        // 淡入显示
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 几秒后淡出删除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 初始化购物车图标
    function initCartIcon() {
        const userInfo = document.querySelector('.user-info');
        if (!userInfo) return;

        // 检查购物车图标是否已经存在
        let cartIcon = userInfo.querySelector('.cart-icon');
        if (cartIcon) return;

        // 创建购物车图标
        cartIcon = document.createElement('div');
        cartIcon.className = 'cart-icon';

        // 创建图标元素
        const iconElement = document.createElement('i');
        iconElement.className = 'bi bi-cart';
        cartIcon.appendChild(iconElement);

        // 创建数量元素
        const countElement = document.createElement('span');
        countElement.className = 'cart-count';
        countElement.textContent = '0';
        cartIcon.appendChild(countElement);

        // 将购物车图标插入到登录和注册按钮之前
        userInfo.insertBefore(cartIcon, userInfo.firstChild);

        // 添加点击事件
        cartIcon.addEventListener('click', function () {
            showShoppingCart();
        });

        // 创建后刷新购物车数量
        fetchCartCount();
        console.log('购物车图标初始化完成');
    }

    // 显示购物车内容（从后端拉取购物车列表，刷新后也能看到已加购商品）
    function showShoppingCart() {
        var token = localStorage.getItem('token');
        var API_BASE = window.ZhiliApi.apiAuth();

        // 已登录则从后端获取购物车列表，再渲染弹窗
        if (token) {
            fetch(API_BASE + '/cart', { headers: { 'Authorization': 'Bearer ' + token } })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.code === 200 && Array.isArray(data.data)) {
                        // 转为页面使用的格式：id, name, image, color, size, price, quantity
                        window.cartItems = data.data.map(function(item) {
                            return {
                                id: String(item.id),
                                productId: item.productId || item.id,
                                name: item.productName || '',
                                image: item.imageUrl || '',
                                color: item.selectedColor || '默认',
                                size: item.selectedSize || '默认',
                                price: item.price != null ? Number(item.price) : 0,
                                quantity: item.quantity != null ? item.quantity : 1
                            };
                        });
                    } else {
                        window.cartItems = window.cartItems || [];
                    }
                    renderCartModal();
                })
                .catch(function() {
                    window.cartItems = window.cartItems || [];
                    renderCartModal();
                });
        } else {
            window.cartItems = window.cartItems || [];
            renderCartModal();
        }
    }

    // 根据 window.cartItems 渲染购物车弹窗
    function renderCartModal() {
        // 创建购物车模态框
        const cartModal = document.createElement('div');
        cartModal.className = 'checkout-modal';

        // 购物车内容
        let cartContent = '';

        if (window.cartItems.length > 0) {
            // 计算商品总额
            const totalAmount = window.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            
            // 计算优惠金额（这里简化为总额的10%）
            const discountAmount = totalAmount * 0.1;
            
            // 计算应付金额
            const payableAmount = totalAmount - discountAmount;

            // 构建购物车内容
            cartContent = `
                <div class="checkout-content">
                    <span class="close-modal"><i class="bi bi-x-lg"></i></span>
                    <h2>购物车</h2>
                    <div class="checkout-info">
                        <div class="checkout-product">
                            <h3>已选商品（${window.cartItems.length}）</h3>
                            ${generateCartItemsHTML(window.cartItems)}
                        </div>
                        <div class="checkout-summary">
                            <div class="summary-item">
                                <span>商品总额：</span>
                                <span id="cart-total-amount">¥${totalAmount.toFixed(2)}</span>
                            </div>
                            <div class="summary-item">
                                <span>优惠金额：</span>
                                <span id="cart-discount-amount">-¥${discountAmount.toFixed(2)}</span>
                            </div>
                            <div class="summary-item total">
                                <span>应付金额：</span>
                                <span id="cart-payable-amount">¥${payableAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="checkout-actions">
                            <button class="btn-outline btn-md continue-shopping">继续购物</button>
                            <button class="btn-primary btn-md checkout-btn">去结算</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 购物车为空
            cartContent = `
                <div class="checkout-content">
                    <span class="close-modal"><i class="bi bi-x-lg"></i></span>
                    <h2>购物车</h2>
                    <div class="empty-cart">
                        <i class="bi bi-cart-x"></i>
                        <p>购物车空空如也</p>
                        <button class="btn-primary btn-md">去逛逛</button>
                    </div>
                </div>
            `;
        }

        cartModal.innerHTML = cartContent;
        document.body.appendChild(cartModal);

        // 添加关闭事件
        const closeBtn = cartModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', function () {
            document.body.removeChild(cartModal);
        });

        // 点击模态框外部关闭模态框
        cartModal.addEventListener('click', function (event) {
            if (event.target === cartModal) {
                document.body.removeChild(cartModal);
            }
        });

        // 如果购物车不为空，添加购物车操作事件
        if (window.cartItems.length > 0) {
            // 添加数量增减和删除事件
            addCartItemEvents(cartModal);

            // 继续购物按钮
            const continueBtn = cartModal.querySelector('.continue-shopping');
            if (continueBtn) {
                continueBtn.addEventListener('click', function () {
                    document.body.removeChild(cartModal);
                });
            }

            // 去结算按钮 - 弹出确认订单页面
            const checkoutBtn = cartModal.querySelector('.checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', function () {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        showNotification('请先登录', 'error');
                        window.location.href = 'login.html?redirect=product.html';
                        return;
                    }

                    // 关闭购物车模态框
                    document.body.removeChild(cartModal);

                    // 计算订单总金额
                    const totalAmount = window.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    const discountAmount = totalAmount * 0.1;
                    const payableAmount = totalAmount - discountAmount;

                    // 获取第一个商品的信息作为展示
                    const firstItem = window.cartItems[0];
                    const productImage = firstItem.image || 'https://via.placeholder.com/100x100';

                    // 显示确认订单模态框（复用现有的showCheckoutModal逻辑，但传入购物车商品信息）
                    showCheckoutModalForCart(productImage, totalAmount, discountAmount, payableAmount);
                });
            }
        } else {
            // 购物车为空时显示去逛逛按钮
            const shopBtn = cartModal.querySelector('.empty-cart .btn-primary');
            if (shopBtn) {
                shopBtn.addEventListener('click', function () {
                    document.body.removeChild(cartModal);
                });
            }
        }
    }

    // 生成购物车商品HTML
    function generateCartItemsHTML(items) {
        let itemsHTML = '';

        items.forEach((item, index) => {
            if (index < 5) { // 只显示前5件商品
            itemsHTML += `
                    <div class="product-item" data-id="${item.id}">
                    <div class="item-image">
                            <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>颜色：${item.color} | 尺码：${item.size}</p>
                        <div class="item-price">
                                <span class="price">¥${item.price.toFixed(2)}</span>
                            <div class="quantity-control">
                                <button class="quantity-decrease"><i class="bi bi-dash"></i></button>
                                    <input type="number" value="${item.quantity}" min="1" max="99" readonly>
                                <button class="quantity-increase"><i class="bi bi-plus"></i></button>
                                <button class="delete-item"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        });

        if (items.length > 5) {
            itemsHTML += `<div class="more-items">还有${items.length - 5}件商品 <a href="#">查看全部</a></div>`;
        }

        return itemsHTML;
    }

    // 添加购物车操作事件（数量变更、删除会调用后端接口持久化）
    function addCartItemEvents(cartModal) {
        var token = localStorage.getItem('token');
        var API_BASE = window.ZhiliApi.apiAuth();

        const productItems = cartModal.querySelectorAll('.product-item');

        productItems.forEach(item => {
            const itemId = item.getAttribute('data-id');
            const quantityInput = item.querySelector('input[type="number"]');
            const decreaseBtn = item.querySelector('.quantity-decrease');
            const increaseBtn = item.querySelector('.quantity-increase');
            const deleteBtn = item.querySelector('.delete-item');

            function callUpdateQuantity(newQty) {
                if (!token) return;
                fetch(API_BASE + '/cart/' + itemId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ quantity: newQty })
                }).then(function(res) { return res.json(); }).then(function(data) {
                    if (data.code === 200) fetchCartCount();
                }).catch(function() {});
            }

            function callDelete() {
                if (!token) return;
                fetch(API_BASE + '/cart/' + itemId, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                }).then(function(res) { return res.json(); }).then(function(data) {
                    if (data.code === 200) fetchCartCount();
                }).catch(function() {});
            }

            decreaseBtn.addEventListener('click', function() {
                const cartItem = window.cartItems.find(c => c.id === itemId);
                if (cartItem && cartItem.quantity > 1) {
                    var newQty = cartItem.quantity - 1;
                    cartItem.quantity = newQty;
                    quantityInput.value = newQty;
                    updateCartTotal(cartModal);
                    callUpdateQuantity(newQty);
                }
            });

            increaseBtn.addEventListener('click', function() {
                const cartItem = window.cartItems.find(c => c.id === itemId);
                if (cartItem && cartItem.quantity < 99) {
                    var newQty = cartItem.quantity + 1;
                    cartItem.quantity = newQty;
                    quantityInput.value = newQty;
                    updateCartTotal(cartModal);
                    callUpdateQuantity(newQty);
                }
            });

            deleteBtn.addEventListener('click', function() {
                const index = window.cartItems.findIndex(c => c.id === itemId);
                if (index > -1) {
                    const removedItem = window.cartItems.splice(index, 1)[0];
                    callDelete();

                    const cartCount = document.querySelector('.cart-count');
                    if (cartCount) {
                        var currentCount = parseInt(cartCount.textContent, 10);
                        cartCount.textContent = Math.max(0, currentCount - removedItem.quantity);
                    }

                    item.remove();
                    updateCartTotal(cartModal);

                    if (window.cartItems.length === 0) {
                        document.body.removeChild(cartModal);
                        showShoppingCart();
                    }
                }
            });
        });
    }

    // 更新购物车数量显示
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalCount = window.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalCount;
        }
    }

    // 更新购物车总价
    function updateCartTotal(cartModal) {
        // 计算商品总额
        const totalAmount = window.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // 计算优惠金额（这里简化为总额的10%）
        const discountAmount = totalAmount * 0.1;
        
        // 计算应付金额
        const payableAmount = totalAmount - discountAmount;
        
        // 更新DOM
        const totalAmountElement = cartModal.querySelector('#cart-total-amount');
        const discountAmountElement = cartModal.querySelector('#cart-discount-amount');
        const payableAmountElement = cartModal.querySelector('#cart-payable-amount');
        
        if (totalAmountElement) totalAmountElement.textContent = `¥${totalAmount.toFixed(2)}`;
        if (discountAmountElement) discountAmountElement.textContent = `-¥${discountAmount.toFixed(2)}`;
        if (payableAmountElement) payableAmountElement.textContent = `¥${payableAmount.toFixed(2)}`;
    }
}); 