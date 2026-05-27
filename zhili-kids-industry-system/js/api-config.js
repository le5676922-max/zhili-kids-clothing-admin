/**
 * 全局后端 API 根地址
 * - 公网通过 Nginx 仅开放 80/443 时：必须走同域 /api，不能使用 http://IP:8080（安全组未放行会失败）
 * - 本地 file://：仍指向 localhost:8080
 * - 本地 Live Server 等非标准端口：仍指向本机 :8080
 *
 * 请在任意业务 JS 之前引入： <script src="../js/api-config.js"></script>
 * 若已引入 auth-header.js，则无需再引（auth-header 已内联注入 ZhiliApi）
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
        /** SockJS 入口，与后端注册的 /ws 一致 */
        sockJsHttpBase: function () { return backendOrigin() + '/ws'; },
        useReverseProxy: useReverseProxy
    };
})(typeof window !== 'undefined' ? window : this);
