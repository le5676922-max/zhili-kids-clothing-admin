var cartPage = {
    items: [],
    selectedIds: new Set(),

    init: function () {
        this.loadCartItems();
        this.initEventListeners();
    },

    getApiBase: function () {
        return window.ZhiliApi ? window.ZhiliApi.apiAuth() : 'http://localhost:8080/api/auth';
    },

    getToken: function () {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    },

    loadCartItems: function () {
        var container = document.getElementById('cartContent');
        if (!container) return;
        container.innerHTML = '<div class="loading"><i class="bi bi-arrow-repeat"></i><p>加载中...</p></div>';

        var token = this.getToken();
        if (!token) {
            container.innerHTML = '<div class="empty-cart"><i class="bi bi-cart-x"></i><p>请先登录</p><a href="login.html" class="btn-go-shopping">去登录</a></div>';
            return;
        }

        fetch(this.getApiBase() + '/cart', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result.code === 200 && result.data) {
                cartPage.items = result.data;
                cartPage.selectedIds = new Set();
                cartPage.renderItems();
                cartPage.updateCartBadge();
            } else {
                container.innerHTML = '<div class="empty-cart"><i class="bi bi-cart-x"></i><p>' + (result.message || '加载失败') + '</p><a href="product.html" class="btn-go-shopping">去逛逛</a></div>';
            }
        })
        .catch(function () {
            container.innerHTML = '<div class="empty-cart"><i class="bi bi-cart-x"></i><p>网络错误，请稍后重试</p><a href="product.html" class="btn-go-shopping">去逛逛</a></div>';
        });
    },

    renderItems: function () {
        var container = document.getElementById('cartContent');
        if (!container) return;

        if (!this.items || this.items.length === 0) {
            container.innerHTML = '<div class="empty-cart"><i class="bi bi-cart"></i><p>购物车是空的</p><a href="product.html" class="btn-go-shopping">去逛逛</a></div>';
            document.getElementById('cartSummary').style.display = 'none';
            return;
        }

        document.getElementById('cartSummary').style.display = 'flex';

        var html = '';
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            var checked = this.selectedIds.has(item.id) ? 'checked' : '';
            var imageSrc = item.imageUrl || '../images/product-placeholder.jpg';
            var price = item.price || 0;
            var subtotal = (price * item.quantity).toFixed(2);
            var specText = '';
            if (item.selectedColor) specText += item.selectedColor;
            if (item.selectedSize) specText += (specText ? ' / ' : '') + item.selectedSize;

            html += '<div class="cart-item" data-id="' + item.id + '">';
            html += '  <div class="cart-item-check">';
            html += '    <input type="checkbox" class="item-checkbox" data-id="' + item.id + '" ' + checked + '>';
            html += '  </div>';
            html += '  <div class="cart-item-img">';
            html += '    <img src="' + imageSrc + '" alt="' + (item.productName || '商品') + '" onerror="this.src=\'../images/product-placeholder.jpg\'">';
            html += '  </div>';
            html += '  <div class="cart-item-info">';
            html += '    <div class="cart-item-name">' + (item.productName || '未知商品') + '</div>';
            if (specText) {
                html += '    <div class="cart-item-spec">' + specText + '</div>';
            }
            html += '  </div>';
            html += '  <div class="cart-item-price">¥' + price.toFixed(2) + '</div>';
            html += '  <div class="cart-item-qty">';
            html += '    <button class="qty-btn qty-minus" data-id="' + item.id + '">-</button>';
            html += '    <input type="text" class="qty-input" value="' + item.quantity + '" data-id="' + item.id + '" readonly>';
            html += '    <button class="qty-btn qty-plus" data-id="' + item.id + '">+</button>';
            html += '  </div>';
            html += '  <div class="cart-item-subtotal">¥' + subtotal + '</div>';
            html += '  <div class="cart-item-action">';
            html += '    <button class="btn-delete" data-id="' + item.id + '"><i class="bi bi-trash"></i></button>';
            html += '  </div>';
            html += '</div>';
        }

        container.innerHTML = html;
        this.bindItemEvents();
        this.updateSummary();
    },

    bindItemEvents: function () {
        var self = this;

        document.querySelectorAll('.item-checkbox').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var id = parseInt(this.getAttribute('data-id'));
                if (this.checked) {
                    self.selectedIds.add(id);
                } else {
                    self.selectedIds['delete'](id);
                }
                self.updateSummary();
            });
        });

        document.querySelectorAll('.qty-minus').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = parseInt(this.getAttribute('data-id'));
                self.changeQuantity(id, -1);
            });
        });

        document.querySelectorAll('.qty-plus').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = parseInt(this.getAttribute('data-id'));
                self.changeQuantity(id, 1);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = parseInt(this.getAttribute('data-id'));
                self.deleteItem(id);
            });
        });
    },

    changeQuantity: function (id, delta) {
        var item = null;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                item = this.items[i];
                break;
            }
        }
        if (!item) return;

        var newQty = item.quantity + delta;
        if (newQty < 1) return;

        var token = this.getToken();
        var self = this;

        fetch(this.getApiBase() + '/cart/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ quantity: newQty })
        })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result.code === 200) {
                item.quantity = newQty;
                self.renderItems();
                self.updateCartBadge();
            }
        })
        .catch(function () {});
    },

    deleteItem: function (id) {
        var token = this.getToken();
        var self = this;

        fetch(this.getApiBase() + '/cart/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result.code === 200) {
                var newItems = [];
                for (var i = 0; i < self.items.length; i++) {
                    if (self.items[i].id !== id) {
                        newItems.push(self.items[i]);
                    }
                }
                self.items = newItems;
                self.selectedIds['delete'](id);
                self.renderItems();
                self.updateCartBadge();
            }
        })
        .catch(function () {});
    },

    selectAll: function (checked) {
        this.selectedIds = new Set();
        if (checked) {
            for (var i = 0; i < this.items.length; i++) {
                this.selectedIds.add(this.items[i].id);
            }
        }
        this.renderItems();
    },

    updateSummary: function () {
        var totalCount = 0;
        var totalAmount = 0;
        for (var i = 0; i < this.items.length; i++) {
            if (this.selectedIds.has(this.items[i].id)) {
                totalCount += this.items[i].quantity;
                totalAmount += (this.items[i].price || 0) * this.items[i].quantity;
            }
        }

        var totalEl = document.getElementById('cartTotalAmount');
        var countEl = document.getElementById('cartSelectedCount');
        if (totalEl) totalEl.textContent = '¥' + totalAmount.toFixed(2);
        if (countEl) countEl.textContent = totalCount;

        var checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.disabled = totalCount === 0;
            checkoutBtn.style.opacity = totalCount === 0 ? '0.5' : '1';
            checkoutBtn.style.cursor = totalCount === 0 ? 'not-allowed' : 'pointer';
        }
    },

    updateCartBadge: function () {
        var count = 0;
        for (var i = 0; i < this.items.length; i++) {
            count += this.items[i].quantity;
        }
        var badge = document.querySelector('.cart-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
        if (window.refreshCartBadge) { window.refreshCartBadge(); }
    },

    checkout: function () {
        if (this.selectedIds.size === 0) {
            alert('请选择要结算的商品');
            return;
        }

        var selectedItems = [];
        for (var i = 0; i < this.items.length; i++) {
            if (this.selectedIds.has(this.items[i].id)) {
                selectedItems.push(this.items[i]);
            }
        }

        var token = this.getToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        var orderItems = selectedItems.map(function (item) {
            return {
                productId: item.productId,
                productName: item.productName,
                imageUrl: item.imageUrl || '',
                unitPrice: item.price,
                quantity: item.quantity,
                selectedColor: item.selectedColor || '',
                selectedSize: item.selectedSize || ''
            };
        });

        fetch(this.getApiBase() + '/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ items: orderItems })
        })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result.code === 200) {
                var ids = selectedItems.map(function (item) { return item.id; });
                var deletePromises = ids.map(function (id) {
                    return fetch(cartPage.getApiBase() + '/cart/' + id, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                });
                Promise.all(deletePromises).then(function () {
                    window.location.href = 'orders.html';
                });
            } else {
                alert(result.message || '创建订单失败');
            }
        })
        .catch(function () {
            alert('网络错误，请稍后重试');
        });
    },

    initEventListeners: function () {
        var self = this;

        var selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function () {
                self.selectAll(this.checked);
                var footerCheckbox = document.getElementById('selectAllCheckboxFooter');
                if (footerCheckbox) footerCheckbox.checked = this.checked;
            });
        }

        var selectAllCheckboxFooter = document.getElementById('selectAllCheckboxFooter');
        if (selectAllCheckboxFooter) {
            selectAllCheckboxFooter.addEventListener('change', function () {
                self.selectAll(this.checked);
                var headerCheckbox = document.getElementById('selectAllCheckbox');
                if (headerCheckbox) headerCheckbox.checked = this.checked;
            });
        }

        var checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function () {
                self.checkout();
            });
        }

        var continueShopping = document.querySelector('.btn-continue-shopping');
        if (continueShopping) {
            continueShopping.addEventListener('click', function () {
                window.location.href = 'product.html';
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    cartPage.init();
});
