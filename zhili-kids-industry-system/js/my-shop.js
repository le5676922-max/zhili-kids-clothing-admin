(function () {
    var API_BASE = window.ZhiliApi.apiAuth();
    var UPLOAD_BASE = window.ZhiliApi.apiUpload();

    /** 当前店铺商品原始列表（含 status），用于编辑回填 */
    var rawProductList = [];
    /** 已选择但未上传的图片文件，点击保存时才上传到 OSS */
    var pendingProductImageFile = null;

    function getToken() {
        return localStorage.getItem('token');
    }

    function getUserInfo() {
        var raw = localStorage.getItem('userInfo');
        try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }

    function initEntStatusBanner() {
        var userInfo = getUserInfo();
        if (userInfo && userInfo.userType === 2 && userInfo.enterpriseStatus !== 1) {
            var banner = document.getElementById('myShopEntBanner');
            var msgEl = document.getElementById('myShopEntMsg');
            if (banner) {
                banner.style.display = 'block';
                if (msgEl) {
                    msgEl.textContent = userInfo.enterpriseStatus === 0
                        ? '您的企业账号正在等待管理员审核，审核通过前无法添加/编辑商品。'
                        : '您的企业账号审核未通过，暂无法添加/编辑商品。如有疑问请联系管理员。';
                }
            }
            // 检查 URL 中是否有从岗位/订单页带过来的提示
            var pendingMsg = localStorage.getItem('pendingEntMsg');
            if (pendingMsg && msgEl) {
                msgEl.textContent = pendingMsg;
                localStorage.removeItem('pendingEntMsg');
            }
        }
    }

    /**
     * 待审核(status=0)或已拒绝(status=2)的企业用户：
     * - 可以访问店铺页（查看自己的产品列表）
     * - 不能添加商品、编辑商品、上架下架
     * 前端会在对应按钮处提示
     */
    function requireApprovedEnterpriseForAction(actionLabel) {
        var userInfo = getUserInfo();
        if (!userInfo || userInfo.userType !== 2) return true; // 非企业用户走后端校验
        if (userInfo.enterpriseStatus !== 1) {
            var msg = userInfo.enterpriseStatus === 0
                ? '您的企业账号正在等待管理员审核，审核通过前无法' + actionLabel + '。'
                : '您的企业账号审核未通过，暂无法' + actionLabel + '。如有疑问请联系管理员。';
            alert(msg);
            return false;
        }
        return true;
    }

    function checkLogin() {
        var token = getToken();
        if (!token) {
            window.location.href = 'login.html?redirect=my-shop.html';
            return false;
        }
        return true;
    }

    function showNotification(message, type) {
        type = type || 'info';
        var notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,0.15);z-index:9999;font-size:14px;transition:opacity 0.3s;';
        var colors = { success: '#4caf50', error: '#f44336', warning: '#ff9800', info: '#2196f3' };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.color = '#fff';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(function () {
            notification.style.opacity = '0';
            setTimeout(function () {
                if (notification.parentNode) document.body.removeChild(notification);
            }, 300);
        }, 2500);
    }

    /** 将后端 ProductVO 转为前端卡片所需格式 */
    function mapProductFromApi(item) {
        var badgeObj = null;
        if (item.badge) {
            var badgeTextMap = { 'new': '新品', 'hot': '热销', 'organic': '有机', 'discount': '特惠' };
            badgeObj = { type: item.badge, text: badgeTextMap[item.badge] || item.badge };
        }
        function priceStr(n) {
            if (n == null) return '¥0.00';
            return '¥' + (typeof n === 'number' ? n.toFixed(2) : Number(n).toFixed(2));
        }
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
            certification: item.certification || '',
            status: item.status != null ? item.status : 1
        };
    }

    function createProductCard(product, rawItem) {
        var card = document.createElement('div');
        card.className = 'product-card';
        if (product.status === 0) card.classList.add('product-status-off');
        else card.classList.add('product-status-on');
        if (product.id) card.dataset.productId = product.id;

        if (product.badge) {
            var badge = document.createElement('div');
            badge.className = 'product-badge ' + product.badge.type;
            badge.textContent = product.badge.text;
            card.appendChild(badge);
        }

        var imageContainer = document.createElement('div');
        imageContainer.className = 'product-image';
        var image = document.createElement('img');
        image.src = product.image || '';
        image.alt = product.title;
        imageContainer.appendChild(image);
        card.appendChild(imageContainer);

        var infoContainer = document.createElement('div');
        infoContainer.className = 'product-info';

        var title = document.createElement('h3');
        title.textContent = product.title;
        infoContainer.appendChild(title);

        var description = document.createElement('p');
        description.className = 'product-desc';
        description.textContent = product.description || '';
        infoContainer.appendChild(description);

        var meta = document.createElement('div');
        meta.className = 'product-meta';

        var price = document.createElement('div');
        price.className = 'product-price';
        var currentPrice = document.createElement('span');
        currentPrice.className = 'price-current';
        currentPrice.textContent = product.price.current;
        price.appendChild(currentPrice);
        var originalPrice = document.createElement('span');
        originalPrice.className = 'price-original';
        originalPrice.textContent = product.price.original;
        price.appendChild(originalPrice);
        meta.appendChild(price);

        var sales = document.createElement('div');
        sales.className = 'product-sales';
        sales.textContent = '月销 ' + product.sales + '件';
        meta.appendChild(sales);
        infoContainer.appendChild(meta);

        var footer = document.createElement('div');
        footer.className = 'product-footer';
        var left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '8px';
        var statusTag = document.createElement('span');
        statusTag.className = 'product-status-tag';
        statusTag.textContent = product.status === 1 ? '已上架' : '已下架';
        left.appendChild(statusTag);
        var company = document.createElement('div');
        company.className = 'product-company';
        company.textContent = product.company || '';
        left.appendChild(company);
        footer.appendChild(left);

        var actions = document.createElement('div');
        actions.className = 'product-actions product-actions-merchant';
        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-outline btn-sm';
        editBtn.innerHTML = '<i class="bi bi-pencil"></i> 编辑';
        editBtn.onclick = function () {
            openEditModal(rawItem || product);
        };
        actions.appendChild(editBtn);

        var statusBtn = document.createElement('button');
        statusBtn.type = 'button';
        statusBtn.className = 'btn btn-sm ' + (product.status === 1 ? 'btn-outline' : 'btn-primary');
        statusBtn.innerHTML = product.status === 1 ? '<i class="bi bi-box-seam"></i> 下架' : '<i class="bi bi-box-arrow-up"></i> 上架';
        statusBtn.onclick = function () {
            if (!requireApprovedEnterpriseForAction('操作商品状态')) return;
            var newStatus = product.status === 1 ? 0 : 1;
            updateProductStatus(product.id, newStatus);
        };
        actions.appendChild(statusBtn);

        footer.appendChild(actions);
        infoContainer.appendChild(footer);

        card.appendChild(infoContainer);
        return card;
    }

    function updateProductStatus(productId, status) {
        var token = getToken();
        fetch(API_BASE + '/products/' + encodeURIComponent(productId) + '/status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ status: status })
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result && result.code === 200) {
                    showNotification(status === 1 ? '已上架' : '已下架', 'success');
                    loadMyShopProducts();
                } else {
                    showNotification(result.message || '操作失败', 'error');
                }
            })
            .catch(function (err) {
                console.error(err);
                showNotification('网络错误，请稍后重试', 'error');
            });
    }

    var productFormModal = null;
    var productForm = null;
    var productFormTitle = null;

    function setProductImageUrl(url) {
        var hidden = document.getElementById('productImageUrl');
        var preview = document.getElementById('productImagePreview');
        var statusEl = document.getElementById('productImageStatus');
        if (hidden) hidden.value = url || '';
        if (preview) {
            if (url) {
                preview.innerHTML = '<img src="' + url.replace(/"/g, '') + '" alt="商品主图预览">';
            } else {
                preview.innerHTML = '';
            }
        }
        if (statusEl) statusEl.textContent = url ? '已设置图片链接，保存时写入数据库。' : '';
    }

    function resetProductImageFileInput() {
        var fileInput = document.getElementById('productImageFile');
        if (fileInput) fileInput.value = '';
        pendingProductImageFile = null;
    }

    /** 选择文件时不上传，仅保存文件并显示本地预览；点击保存时才上传到 OSS */
    function onProductImageFileChange() {
        var fileInput = document.getElementById('productImageFile');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            pendingProductImageFile = null;
            setProductImageUrl('');
            return;
        }
        var file = fileInput.files[0];
        pendingProductImageFile = file;
        document.getElementById('productImageUrl').value = '';
        var statusEl = document.getElementById('productImageStatus');
        if (statusEl) statusEl.textContent = '已选择图片，点击「保存」时会上传至 OSS 并保存商品。';
        var preview = document.getElementById('productImagePreview');
        if (preview) {
            var url = (window.URL || window.webkitURL).createObjectURL(file);
            preview.innerHTML = '<img src="' + url + '" alt="本地预览">';
        }
    }

    function getModalElements() {
        if (!productFormModal) {
            productFormModal = document.getElementById('productFormModal');
            productForm = document.getElementById('productForm');
            productFormTitle = document.getElementById('productFormTitle');
        }
        return { modal: productFormModal, form: productForm, titleEl: productFormTitle };
    }

    function openAddModal() {
        if (!requireApprovedEnterpriseForAction('添加商品')) return;
        var el = getModalElements();
        el.titleEl.textContent = '添加商品';
        document.getElementById('productId').value = '';
        document.getElementById('productName').value = '';
        document.getElementById('productDesc').value = '';
        document.getElementById('productCategory').value = '';
        document.getElementById('productAgeRange').value = '';
        document.getElementById('productSeason').value = '';
        document.getElementById('productMaterial').value = '';
        document.getElementById('productCertification').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productOriginalPrice').value = '';
        document.getElementById('productStock').value = '';
        document.getElementById('productBadge').value = '';
        setProductImageUrl('');
        resetProductImageFileInput();
        pendingProductImageFile = null;
        el.modal.style.display = 'flex';
    }

    function openEditModal(item) {
        if (!requireApprovedEnterpriseForAction('编辑商品')) return;
        var el = getModalElements();
        el.titleEl.textContent = '编辑商品';
        document.getElementById('productId').value = item.id || '';
        document.getElementById('productName').value = item.name || item.title || '';
        document.getElementById('productDesc').value = item.description || '';
        var cat = item.category || '';
        if (cat.indexOf('全部产品,') === 0) cat = cat.replace('全部产品,', '');
        document.getElementById('productCategory').value = cat;
        document.getElementById('productAgeRange').value = item.ageRange || '';
        document.getElementById('productSeason').value = item.season || '';
        document.getElementById('productMaterial').value = item.material || '';
        document.getElementById('productCertification').value = item.certification || '';
        var priceVal = item.price;
        if (priceVal != null && typeof item.price === 'object' && item.price.current != null) priceVal = item.price.current;
        if (typeof priceVal === 'string') priceVal = priceVal.replace('¥', '').trim();
        document.getElementById('productPrice').value = priceVal != null && priceVal !== '' ? priceVal : '';
        var origVal = item.originalPrice;
        if (origVal == null && item.price && typeof item.price === 'object') origVal = item.price.original;
        if (typeof origVal === 'string') origVal = origVal.replace('¥', '').trim();
        document.getElementById('productOriginalPrice').value = origVal != null && origVal !== '' ? origVal : '';
        document.getElementById('productStock').value = item.stock != null ? item.stock : '';
        document.getElementById('productBadge').value = (item.badge && item.badge.type) ? item.badge.type : (typeof item.badge === 'string' ? item.badge : '') || '';
        setProductImageUrl(item.imageUrl || item.image || '');
        resetProductImageFileInput();
        pendingProductImageFile = null;
        el.modal.style.display = 'flex';
    }

    function closeProductModal() {
        var el = getModalElements();
        if (el.modal) el.modal.style.display = 'none';
    }

    function buildRequestBody() {
        var priceVal = document.getElementById('productPrice').value;
        var origVal = document.getElementById('productOriginalPrice').value;
        var stockVal = document.getElementById('productStock').value;
        return {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDesc').value.trim(),
            category: document.getElementById('productCategory').value || null,
            ageRange: document.getElementById('productAgeRange').value || null,
            season: document.getElementById('productSeason').value || null,
            material: document.getElementById('productMaterial').value.trim() || null,
            certification: document.getElementById('productCertification').value || null,
            price: priceVal ? parseFloat(priceVal) : null,
            originalPrice: origVal ? parseFloat(origVal) : null,
            stock: stockVal ? parseInt(stockVal, 10) : 0,
            badge: document.getElementById('productBadge').value || null,
            imageUrl: document.getElementById('productImageUrl').value.trim() || null
        };
    }

    function submitProductForm(e) {
        e.preventDefault();
        var id = document.getElementById('productId').value.trim();
        var body = buildRequestBody();
        if (!body.name) {
            showNotification('请填写商品名称', 'warning');
            return;
        }
        if (body.price == null || isNaN(body.price) || body.price < 0) {
            showNotification('请填写有效的现价', 'warning');
            return;
        }
        var stockVal = document.getElementById('productStock').value;
        if (stockVal === '' || isNaN(parseInt(stockVal, 10)) || parseInt(stockVal, 10) < 0) {
            showNotification('请填写有效的库存数量', 'warning');
            return;
        }
        var fileInput = document.getElementById('productImageFile');
        var hasPendingFile = (fileInput && fileInput.files && fileInput.files[0]) || pendingProductImageFile;
        if (!id && !hasPendingFile && !(body.imageUrl && body.imageUrl.length > 0)) {
            showNotification('请选择商品主图', 'warning');
            return;
        }

        var token = getToken();
        var productUrl = API_BASE + '/products';
        var method = 'POST';
        if (id) {
            productUrl = API_BASE + '/products/' + encodeURIComponent(id);
            method = 'PUT';
        }

        function doSaveProduct(imageUrl) {
            body.imageUrl = imageUrl || body.imageUrl || null;
            fetch(productUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(body)
            })
                .then(function (res) { return res.json(); })
                .then(function (result) {
                    if (result && result.code === 200) {
                        showNotification(id ? '修改成功' : '上架成功', 'success');
                        closeProductModal();
                        loadMyShopProducts();
                    } else {
                        showNotification(result.message || '保存失败', 'error');
                    }
                })
                .catch(function (err) {
                    console.error(err);
                    showNotification('网络错误，请稍后重试', 'error');
                });
        }

        if (hasPendingFile) {
            var file = (fileInput && fileInput.files && fileInput.files[0]) || pendingProductImageFile;
            if (!file) {
                doSaveProduct(body.imageUrl);
                return;
            }
            showNotification('正在上传图片到 OSS...', 'info');
            var fd = new FormData();
            fd.append('file', file);
            fetch(UPLOAD_BASE + '/product', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: fd
            })
                .then(function (res) { return res.json(); })
                .then(function (result) {
                    if (result && result.code === 200 && result.data && result.data.url) {
                        doSaveProduct(result.data.url);
                    } else {
                        showNotification((result && result.message) || '图片上传失败', 'error');
                    }
                })
                .catch(function (err) {
                    console.error(err);
                    showNotification('图片上传失败，请稍后重试', 'error');
                });
        } else {
            doSaveProduct(body.imageUrl);
        }
    }

    function loadMyShopProducts() {
        if (!checkLogin()) return;

        var container = document.getElementById('myShopContent');
        var token = getToken();

        fetch(API_BASE + '/products/my', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result && result.code === 200 && Array.isArray(result.data) && result.data.length > 0) {
                    rawProductList = result.data;
                    var list = result.data.map(mapProductFromApi);
                    var wrapper = document.createElement('div');
                    wrapper.className = 'product-list';
                    list.forEach(function (p, i) {
                        wrapper.appendChild(createProductCard(p, rawProductList[i]));
                    });
                    container.innerHTML = '';
                    container.appendChild(wrapper);
                } else {
                    rawProductList = [];
                    container.innerHTML = '<div class="no-results">暂无店铺商品，去发布一些商品吧！<br><a href="product.html">返回产品展示</a></div>';
                }
            })
            .catch(function (err) {
                console.error('加载店铺商品失败:', err);
                container.innerHTML = '<div class="no-results">加载失败，请稍后重试。<br><a href="product.html">返回产品展示</a></div>';
            });
    }

    function initModal() {
        var el = getModalElements();
        if (!el.modal || !el.form) return;

        document.getElementById('btnAddProduct').addEventListener('click', openAddModal);
        document.getElementById('productFormModalClose').addEventListener('click', closeProductModal);
        document.getElementById('productFormCancel').addEventListener('click', closeProductModal);
        el.form.addEventListener('submit', submitProductForm);

        var imgFile = document.getElementById('productImageFile');
        if (imgFile) imgFile.addEventListener('change', onProductImageFileChange);

        el.modal.addEventListener('click', function (e) {
            if (e.target === el.modal) closeProductModal();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initEntStatusBanner();
            loadMyShopProducts();
            initModal();
        });
    } else {
        initEntStatusBanner();
        loadMyShopProducts();
        initModal();
    }
})();
