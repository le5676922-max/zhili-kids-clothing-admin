/**
 * 公共脚本（各页面共用）
 * 自动加载 AI 助手等全局组件
 */
(function () {
    'use strict';

    // 自动加载 AI 助手
    function loadAIAssistant() {
        if (window.disableAIAssistant) return;
        if (window.AIAssistant) return;

        var jsBasePath = window.location.pathname.includes('/pages/') ? '../js/' : 'js/';
        var script = document.createElement('script');
        script.src = jsBasePath + 'ai-assistant.js';
        script.onload = function() {
            console.log('AI 助手已加载');
        };
        script.onerror = function() {
            console.error('AI 助手加载失败');
        };
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAIAssistant);
    } else {
        loadAIAssistant();
    }

    // 购物车角标已由 product.js 的 initCartIcon 统一管理（.user-info 内的 .cart-icon）
    // 此处不再重复创建导航栏购物车入口，避免出现两个购物车图标

    function getPagePath() {
        return window.location.pathname.includes('/pages/') ? '' : 'pages/';
    }

    function updateCartBadge() {
        var token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        var apiBase = window.ZhiliApi ? window.ZhiliApi.apiAuth() : 'http://localhost:8080/api/auth';
        fetch(apiBase + '/cart/count', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function (res) { return res.json(); })
        .then(function (result) {
            if (result.code === 200) {
                var count = result.data || 0;
                var badges = document.querySelectorAll('.cart-count-badge');
                badges.forEach(function (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'inline-flex' : 'none';
                });
            }
        })
        .catch(function () {});
    }

    // ========== 通知 WebSocket 实时推送 ==========

    var notifWsClient = null;
    var notifWsConnected = false;

    function initNotificationWebSocket() {
        var token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        try {
            var payload = JSON.parse(atob(token.split('.')[1]));
            var userId = payload.userId || payload.sub || payload.id;
            if (!userId) return;
            connectNotificationWs(token, userId);
        } catch (e) {
            // token 解析失败，跳过 WebSocket
        }
    }

    function connectNotificationWs(token, userId) {
        if (notifWsConnected) return;
        loadStompLibs(function () {
            if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') return;
            try {
                var socket = new SockJS('/ws');
                var client = Stomp.over(socket);
                client.connect({ 'Authorization': 'Bearer ' + token, 'token': token }, function () {
                    notifWsConnected = true;
                    notifWsClient = client;

                    client.subscribe('/topic/notification/user/' + userId, function (msg) {
                        try {
                            var notification = JSON.parse(msg.body);
                            showNotificationToast(notification);
                            updateNavUnreadCount();
                        } catch (e) {}
                    });

                    client.subscribe('/topic/notification/unread/' + userId, function (msg) {
                        try {
                            var count = parseInt(msg.body);
                            updateNavUnreadCount(count);
                        } catch (e) {}
                    });
                }, function () {
                    setTimeout(function () { connectNotificationWs(token, userId); }, 10000);
                });
            } catch (e) {}
        });
    }

    function loadStompLibs(callback) {
        if (typeof Stomp !== 'undefined' && typeof SockJS !== 'undefined') {
            callback();
            return;
        }
        var loaded = 0;
        var total = 2;

        function checkDone() {
            loaded++;
            if (loaded >= total) callback();
        }

        if (typeof SockJS === 'undefined') {
            var sockJs = document.createElement('script');
            sockJs.src = 'https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js';
            sockJs.onload = checkDone;
            sockJs.onerror = checkDone;
            document.head.appendChild(sockJs);
        } else {
            loaded++;
        }

        if (typeof Stomp === 'undefined') {
            var stomp = document.createElement('script');
            stomp.src = 'https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js';
            stomp.onload = checkDone;
            stomp.onerror = checkDone;
            document.head.appendChild(stomp);
        } else {
            loaded++;
        }

        if (loaded >= total) callback();
    }

    function showNotificationToast(notification) {
        var existing = document.querySelector('.notif-toast');
        if (existing) existing.remove();

        var targetUrl = notification.targetUrl || 'pages/notifications.html';

        var toast = document.createElement('div');
        toast.className = 'notif-toast';
        toast.style.cursor = 'pointer';
        toast.title = '点击查看详情';
        toast.innerHTML = '<div class="notif-toast-icon"><i class="bi bi-bell"></i></div><div class="notif-toast-body"><div class="notif-toast-title">' + (notification.title || '新通知') + '</div><div class="notif-toast-content">' + (notification.content || '') + '</div></div>';
        toast.addEventListener('click', function () {
            window.location.href = targetUrl;
        });
        document.body.appendChild(toast);

        setTimeout(function () { toast.classList.add('show'); }, 10);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 4000);
    }

    function updateNavUnreadCount(count) {
        if (count === undefined) {
            var token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;
            var apiBase = window.ZhiliApi ? window.ZhiliApi.apiAuth() : 'http://localhost:8080/api/auth';
            fetch(apiBase + '/notifications/unread-count', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result.code === 200) {
                    updateUnreadBadgeUI(result.data || 0);
                }
            })
            .catch(function () {});
        } else {
            updateUnreadBadgeUI(count);
        }
    }

    function updateUnreadBadgeUI(count) {
        var badge = document.querySelector('.notif-unread-badge');
        if (count > 0) {
            if (!badge) {
                var notifLink = document.querySelector('a[href*="notifications"], a[href*="message"]');
                if (!notifLink) return;
                badge = document.createElement('span');
                badge.className = 'notif-unread-badge';
                notifLink.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    // ========== Issue 11: 动态更新版权年份 ==========

    function updateCopyrightYear() {
        var currentYear = new Date().getFullYear();
        var copyrightElements = document.querySelectorAll('footer p, .footer p');
        copyrightElements.forEach(function (el) {
            el.innerHTML = el.innerHTML.replace(/\b20\d{2}\b/g, currentYear);
        });
    }

    // ========== Issue 12: 图片加载失败占位处理 ==========

    function handleImageError() {
        document.addEventListener('error', function (e) {
            var target = e.target;
            if (target.tagName === 'IMG') {
                target.onerror = null;
                target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f5f5f5" width="200" height="200"/><text fill="#cccccc" font-family="Arial" font-size="14" text-anchor="middle" x="100" y="110">图片加载失败</text><path fill="none" stroke="#e0e0e0" stroke-width="2" d="M60 80h80v60H60z"/></svg>');
            }
        }, true);
    }

    // ========== 全局 Toast 通用通知（所有页面可用） ==========

    function showToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('globalToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'globalToastContainer';
            document.body.appendChild(container);
        }

        var icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
        var colors = { success: '#4caf50', error: '#e74c3c', warning: '#ff9800', info: '#2196f3' };

        var toast = document.createElement('div');
        toast.className = 'global-toast';
        toast.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 20px;background:#fff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);margin-bottom:8px;font-size:14px;color:#333;transform:translateX(120%);transition:transform 0.3s ease;max-width:360px;';
        toast.innerHTML = '<i class="bi ' + (icons[type] || icons.info) + '" style="font-size:18px;color:' + (colors[type] || colors.info) + ';flex-shrink:0;"></i><span>' + message + '</span>';
        container.appendChild(toast);

        requestAnimationFrame(function () {
            toast.style.transform = 'translateX(0)';
        });

        setTimeout(function () {
            toast.style.transform = 'translateX(120%)';
            setTimeout(function () { toast.remove(); }, 300);
        }, 3500);
    }

    window.ZhiliToast = {
        success: function (msg) { showToast(msg, 'success'); },
        error: function (msg) { showToast(msg || '操作失败', 'error'); },
        warning: function (msg) { showToast(msg, 'warning'); },
        info: function (msg) { showToast(msg, 'info'); }
    };

    // ========== 通用 UI 状态工具：加载中 / 空数据 / 错误 ==========

    function setLoadingState(el) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="bi bi-arrow-repeat" style="font-size:24px;display:block;margin-bottom:12px;"></i><p>加载中...</p></div>';
    }

    function setEmptyState(el, message) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        message = message || '暂无数据';
        el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;"><i class="bi bi-inbox" style="font-size:48px;display:block;margin-bottom:16px;color:#ddd;"></i><p style="font-size:15px;margin:0;">' + message + '</p></div>';
    }

    function setErrorState(el, message, retryFn) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        message = message || '加载失败，请稍后重试';
        var html = '<div style="text-align:center;padding:60px 20px;color:#999;"><i class="bi bi-exclamation-circle" style="font-size:48px;display:block;margin-bottom:16px;color:#f0ad4e;"></i><p style="font-size:15px;margin:0 0 16px 0;">' + message + '</p>';
        if (retryFn) {
            html += '<button onclick="(' + retryFn.toString() + ')()" style="padding:8px 20px;border:1px solid var(--primary-color);background:var(--primary-color);color:#fff;border-radius:6px;cursor:pointer;font-size:14px;">重试</button>';
        }
        html += '</div>';
        el.innerHTML = html;
    }

    window.ZhiliUI = {
        loading: setLoadingState,
        empty: setEmptyState,
        error: setErrorState
    };

    // ========== 购物车徽标自动刷新事件 ==========

    window.refreshCartBadge = function () {
        updateCartBadge();
    };

    // ========== 全局 Fetch 请求封装（自动携带 Token + 统一错误处理） ==========

    function apiRequest(url, options) {
        options = options || {};
        var method = (options.method || 'GET').toUpperCase();
        var token = localStorage.getItem('token') || sessionStorage.getItem('token');

        var headers = options.headers || {};
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        var fetchOptions = {
            method: method,
            headers: headers
        };

        if (options.body) {
            if (typeof options.body === 'string') {
                fetchOptions.body = options.body;
            } else {
                fetchOptions.body = JSON.stringify(options.body);
            }
        }

        return fetch(url, fetchOptions)
            .then(function (res) {
                if (!res.ok) {
                    if (res.status === 401) {
                        if (options.showAuthError !== false) {
                            showToast('登录已过期，请重新登录', 'warning');
                        }
                    }
                    throw new Error('HTTP ' + res.status);
                }
                return res.json();
            })
            .then(function (result) {
                if (result.code !== 200 && options.showError !== false) {
                    showToast(result.message || '操作失败', 'error');
                }
                return result;
            })
            .catch(function (err) {
                if (err.message && err.message.indexOf('HTTP') === 0) {
                    // 已处理过的错误
                } else if (options.showError !== false) {
                    showToast('网络错误，请稍后重试', 'error');
                }
                throw err;
            });
    }

    function getApiBase(module) {
        var ZhiliApi = window.ZhiliApi;
        if (!ZhiliApi) {
            return 'http://localhost:8080/api';
        }
        switch (module) {
            case 'auth': return ZhiliApi.apiAuth();
            case 'admin': return ZhiliApi.apiAdmin();
            case 'upload': return ZhiliApi.apiUpload();
            default: return ZhiliApi.apiRoot();
        }
    }

    window.ZhiliApiRequest = {
        get: function (url, options) {
            options = options || {};
            options.method = 'GET';
            return apiRequest(url, options);
        },
        post: function (url, data, options) {
            options = options || {};
            options.method = 'POST';
            if (data) options.body = data;
            return apiRequest(url, options);
        },
        put: function (url, data, options) {
            options = options || {};
            options.method = 'PUT';
            if (data) options.body = data;
            return apiRequest(url, options);
        },
        delete: function (url, options) {
            options = options || {};
            options.method = 'DELETE';
            return apiRequest(url, options);
        },
        apiBase: getApiBase
    };

    // ========== Issue 13: Header中显示未读消息图标 ==========

    function addNotifHeaderEntry() {
        var userInfo = document.querySelector('.user-info');
        if (!userInfo) return;
        if (document.querySelector('.header-notif-entry')) return;

        var token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        var notifHtml = '<div class="header-notif-entry">';
        notifHtml += '<a href="' + getPagePath() + 'notifications.html" title="消息通知"><i class="bi bi-bell"></i>';
        notifHtml += '<span class="notif-unread-badge header-badge" style="display:none;">0</span>';
        notifHtml += '</a></div>';

        userInfo.insertAdjacentHTML('afterbegin', notifHtml);
    }

    // 初始化
    function initCommon() {
        setTimeout(updateCartBadge, 1000);
        updateCopyrightYear();
        handleImageError();

        var token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            addNotifHeaderEntry();
            setTimeout(function () {
                initNotificationWebSocket();
                setTimeout(updateNavUnreadCount, 500);
            }, 2000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCommon);
    } else {
        initCommon();
    }
})();
