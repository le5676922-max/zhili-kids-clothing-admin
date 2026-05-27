/**
 * 全局后端 API 根（与 api-config.js 同步）：公网 Nginx 仅开放 80 时须走同域 /api
 */
(function (global) {
    if (global.ZhiliApi) return;
    function fileProtocol() {
        return global.location && global.location.protocol === 'file:';
    }
    function useReverseProxy() {
        if (!global.location || fileProtocol()) return false;
        var p = global.location.port;
        var h = global.location.hostname || '';
        // 标准 HTTP 端口 或 本地 Nginx（如 8081）均走同域 /api，由 Nginx 反代
        if (p === '' || p === '80' || p === '443') return true;
        if (h === 'localhost' || h === '127.0.0.1') return true;
        return false;
    }
    function backendOrigin() {
        if (fileProtocol()) return 'http://localhost:8080';
        if (useReverseProxy()) return global.location.origin;
        var h = global.location.hostname || 'localhost';
        return 'http://' + h + ':8080';
    }
    function apiRoot() {
        return backendOrigin() + '/api';
    }
    global.ZhiliApi = {
        backendOrigin: backendOrigin,
        apiRoot: apiRoot,
        apiAuth: function () { return apiRoot() + '/auth'; },
        apiAdmin: function () { return apiRoot() + '/admin'; },
        apiUpload: function () { return apiRoot() + '/upload'; },
        apiOssRoot: function () { return apiRoot() + '/oss'; },
        sockJsHttpBase: function () { return backendOrigin() + '/ws'; },
        useReverseProxy: useReverseProxy
    };
})(typeof window !== 'undefined' ? window : this);

/**
 * 头部登录状态：未登录显示「登录/注册」，已登录显示用户信息与「退出登录」
 * 并全局拦截 fetch：当接口返回 401 且提示「账号已被管理员注销」时，弹窗并跳转登录页
 */
(function() {
    var TOKEN_KEY = 'token';
    var USER_INFO_KEY = 'userInfo';

    function getLoginUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 || path.endsWith('/') ? 'login.html' : 'pages/login.html';
    }

    function getIndexUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? '../index.html' : 'index.html';
    }

    function getChangePasswordUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? 'change-password.html' : 'pages/change-password.html';
    }

    function getPersonalCenterUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? 'profile.html' : 'pages/profile.html';
    }

    function getWorkOrderUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? 'work-order.html' : 'pages/work-order.html';
    }

    function getOrdersUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? 'orders.html' : 'pages/orders.html';
    }

    function getRefundsUrl() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? 'refunds.html' : 'pages/refunds.html';
    }

    function getImageBase() {
        var path = window.location.pathname || '';
        return path.indexOf('pages') >= 0 ? '../images/' : 'images/';
    }

    // 生成带昵称首字的默认头像（彩色背景 + 首字）
    function generateDefaultAvatar(nick) {
        var firstChar = '';
        if (nick && nick.length > 0) {
            firstChar = nick.charAt(0);
        }
        // 彩色背景色板
        var colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'];
        var colorIndex = 0;
        if (nick && nick.length > 0) {
            colorIndex = nick.charCodeAt(0) % colors.length;
        }
        var color = colors[colorIndex];
        // SVG：圆形背景 + 白色首字
        var svg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Ccircle cx="24" cy="24" r="24" fill="' + encodeURIComponent(color) + '"/%3E%3Ctext x="24" y="31" text-anchor="middle" fill="white" font-size="22" font-family="Microsoft YaHei, sans-serif" font-weight="500"%3E' + encodeURIComponent(firstChar) + '%3C/text%3E%3C/svg%3E';
        return svg;
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderHeader() {
        var userInfoEl = document.querySelector('.user-info');
        if (!userInfoEl) return;

        var token = localStorage.getItem(TOKEN_KEY);
        var userInfoStr = localStorage.getItem(USER_INFO_KEY);
        var userInfo = null;
        try {
            if (userInfoStr) userInfo = JSON.parse(userInfoStr);
        } catch (e) {}

        var guestWrap = userInfoEl.querySelector('.user-info-guest');
        var loggedWrap = userInfoEl.querySelector('.user-info-logged');

        if (token && userInfo) {
            if (guestWrap) guestWrap.style.display = 'none';
            if (!loggedWrap) {
                var logged = document.createElement('div');
                logged.className = 'user-info-logged';
                var nick = (userInfo.nickname || userInfo.username || userInfo.email || '用户');
                var email = userInfo.email || '';
                // 有自定义头像则用自定义头像，否则用昵称首字生成默认头像
                var avatarSrc = (userInfo.avatar && userInfo.avatar.trim()) ? userInfo.avatar : generateDefaultAvatar(nick);
                logged.innerHTML =
                    '<div class="user-dropdown-wrap">' +
                    '  <img class="user-avatar" src="' + avatarSrc + '" alt="头像" style="width:40px;height:40px;max-width:40px;max-height:40px;object-fit:cover;">' +
                    '  <div class="user-dropdown-panel">' +
                    '    <div class="user-dropdown-nickname">' + escapeHtml(nick) + '</div>' +
                    '    <div class="user-dropdown-email">' + escapeHtml(email) + '</div>' +
                    '    <a href="' + getPersonalCenterUrl() + '" class="btn btn-profile">个人中心</a>' +
                    '    <a href="' + getChangePasswordUrl() + '" class="btn btn-change-password">修改密码</a>' +
                    '    <a href="' + getWorkOrderUrl() + '" class="btn btn-work-order">我的工单</a>' +
                    '    <a href="' + getOrdersUrl() + '" class="btn btn-orders">我的订单</a>' +
                    '    <a href="' + getRefundsUrl() + '" class="btn btn-refunds">退款/售后</a>' +
                    '    <a href="#" class="btn btn-logout">退出登录</a>' +
                    '  </div>' +
                    '</div>';
                userInfoEl.appendChild(logged);

                var wrap = logged.querySelector('.user-dropdown-wrap');
                var panel = logged.querySelector('.user-dropdown-panel');
                var avatarEl = logged.querySelector('.user-avatar');
                var img = logged.querySelector('.user-avatar');
                if (img) { img.style.cssText = 'width:40px;height:40px;max-width:40px;max-height:40px;object-fit:cover;'; }
                if (wrap && panel && avatarEl) {
                    // 初始必须隐藏且移出视口，达到图二效果：头部只显示小头像
                    panel.style.display = 'none';
                    panel.style.position = 'fixed';
                    panel.style.left = '-9999px';
                    panel.style.top = '0';
                    panel.style.maxWidth = '280px';
                    panel.style.width = 'max-content';
                    var hideTimer = null;
                    var HIDE_DELAY_MS = 800;
                    function showPanelBelowAvatar(el) {
                        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
                        var rect = el.getBoundingClientRect();
                        panel.style.position = 'fixed';
                        panel.style.top = (rect.bottom + 4) + 'px';
                        panel.style.left = (rect.left + rect.width / 2) + 'px';
                        panel.style.right = 'auto';
                        panel.style.transform = 'translateX(-50%)';
                        panel.style.display = 'block';
                    }
                    function hidePanel() {
                        hideTimer = setTimeout(function() {
                            panel.style.display = 'none';
                            panel.style.left = '-9999px';
                            hideTimer = null;
                        }, HIDE_DELAY_MS);
                    }
                    wrap.addEventListener('mouseenter', function() { showPanelBelowAvatar(avatarEl); });
                    wrap.addEventListener('mouseleave', hidePanel);
                    panel.addEventListener('mouseenter', function() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } panel.style.display = 'block'; });
                    panel.addEventListener('mouseleave', hidePanel);
                }
            } else {
                loggedWrap.style.display = 'flex';
                var nickEl = loggedWrap.querySelector('.user-dropdown-nickname');
                var emailEl = loggedWrap.querySelector('.user-dropdown-email');
                var av = loggedWrap.querySelector('.user-avatar');
                var nick = userInfo.nickname || userInfo.username || userInfo.email || '用户';
                if (nickEl) nickEl.textContent = nick;
                if (emailEl) emailEl.textContent = userInfo.email || '';
                if (av) {
                    var avatarSrc = (userInfo.avatar && userInfo.avatar.trim()) ? userInfo.avatar : generateDefaultAvatar(nick);
                    av.src = avatarSrc;
                    av.style.cssText = 'width:40px;height:40px;max-width:40px;max-height:40px;object-fit:cover;';
                }
                var wrap = loggedWrap.querySelector('.user-dropdown-wrap');
                var panel = loggedWrap.querySelector('.user-dropdown-panel');
                if (wrap && panel && av && !wrap._dropdownPositionBound) {
                    wrap._dropdownPositionBound = true;
                    panel.style.display = 'none';
                    panel.style.position = 'fixed';
                    panel.style.left = '-9999px';
                    panel.style.maxWidth = '280px';
                    panel.style.width = 'max-content';
                    var hideTimer = null;
                    var HIDE_DELAY_MS = 800;
                    function showPanelBelowAvatar(el) {
                        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
                        var rect = el.getBoundingClientRect();
                        panel.style.position = 'fixed';
                        panel.style.top = (rect.bottom + 4) + 'px';
                        panel.style.left = (rect.left + rect.width / 2) + 'px';
                        panel.style.right = 'auto';
                        panel.style.transform = 'translateX(-50%)';
                        panel.style.display = 'block';
                    }
                    function hidePanel() {
                        hideTimer = setTimeout(function() {
                            panel.style.display = 'none';
                            panel.style.left = '-9999px';
                            hideTimer = null;
                        }, HIDE_DELAY_MS);
                    }
                    wrap.addEventListener('mouseenter', function() { showPanelBelowAvatar(av); });
                    wrap.addEventListener('mouseleave', hidePanel);
                    panel.addEventListener('mouseenter', function() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } panel.style.display = 'block'; });
                    panel.addEventListener('mouseleave', hidePanel);
                }
            }
        } else {
            if (guestWrap) guestWrap.style.display = 'flex';
            if (loggedWrap) loggedWrap.style.display = 'none';
        }

        // 顶部导航中产品页链接统一显示为「商城」
        var productNavText = '商城';
        var navLinks = document.querySelectorAll('.main-nav a[href*="product.html"]');
        if (navLinks && navLinks.length) {
            navLinks.forEach(function (a) { a.textContent = productNavText; });
        }
    }

    /** 退出登录：使用事件委托，确保无论 DOM 何时创建都能响应 */
    function onLogout(e) {
        if (e.target && e.target.closest && e.target.closest('.btn-logout')) {
            e.preventDefault();
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_INFO_KEY);
            alert('已退出账号');
            window.location.href = getLoginUrl();
        }
    }

    /** 账号已被管理员注销时：清登录态、弹窗、跳转登录 */
    function handleAccountDeactivated() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUserInfo');
        alert('您的账号已被管理员注销');
        window.location.href = getLoginUrl();
    }

    /**
     * 统一登录拦截器：
     * 1. 所有需要登录的 API 请求（任何含 /api/auth/ 的 POST/PUT/DELETE 请求），
     *    若后端返回 401，说明 token 失效或未登录，前端自动跳转登录页。
     * 2. 若 401 且 message 含「管理员注销」，执行 handleAccountDeactivated()（账号已注销）。
     * 3. 仅在用户本地有 token 时触发，避免登录页本身请求时误判。
     * 4. 仅拦截 API 接口，避免非 API 请求（如 /ws/**）误触发。
     */
    (function wrapFetch() {
        var origFetch = window.fetch;
        if (!origFetch) return;
        window.fetch = function(url, options) {
            var isApiCall = (typeof url === 'string' && url.indexOf('/api/') !== -1);
            var isWriteOp = false;
            if (options && options.method) {
                var m = options.method.toUpperCase();
                isWriteOp = (m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE');
            }
            var hasLocalToken = !!localStorage.getItem(TOKEN_KEY);

            return origFetch.apply(this, arguments).then(function(res) {
                if (res.status === 401 && isApiCall && hasLocalToken) {
                    var clone = res.clone();
                    clone.json().then(function(data) {
                        if (data && typeof data.message === 'string' && data.message.indexOf('管理员注销') !== -1) {
                            handleAccountDeactivated();
                        } else if (isWriteOp) {
                            // token 失效/未登录，强制跳转登录页
                            alert('登录已失效，请重新登录');
                            window.location.href = getLoginUrl() + '?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
                        }
                    }).catch(function() {
                        if (isWriteOp) {
                            alert('登录已失效，请重新登录');
                            window.location.href = getLoginUrl() + '?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
                        }
                    });
                }
                return res;
            });
        };
    })();

    function init() {
        function run() {
            renderHeader();
            // 延迟再执行一次，确保其它脚本或 Vue 挂载后登录状态仍正确显示
            setTimeout(renderHeader, 150);
            setTimeout(renderHeader, 500);
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
        document.addEventListener('click', onLogout);
    }

    init();
    // 供 Vue 等框架在挂载后重新渲染头部（首页 #app 被 Vue 接管后会覆盖 DOM）
    window.renderAuthHeader = renderHeader;
})();
