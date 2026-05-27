/**
 * 临时会话模块 - 基于闲鱼式临时对话理念
 * 
 * 功能：
 * 1. 会话管理 - 创建/查询/关闭会话
 * 2. 消息收发 - WebSocket + HTTP 降级
 * 3. 在线状态 - 实时感知
 * 4. 离线消息 - 本地缓存
 * 5. 黑名单 - 防骚扰
 */

(function(window) {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        API_BASE: window.ZhiliApi ? window.ZhiliApi.apiAuth() : '/api/auth',
        WS_BASE: window.ZhiliApi ? window.ZhiliApi.sockJsHttpBase() : '/ws',
        HEARTBEAT_INTERVAL: 60000,      // 心跳间隔 60 秒
        RECONNECT_INTERVAL: 5000,        // 重连间隔 5 秒
        MAX_RECONNECT: 10,              // 最大重连次数
    };

    // ==================== 存储键 ====================
    const STORAGE_KEYS = {
        TOKEN: 'tempChatToken',
        USER_ID: 'tempChatUserId',
        SESSIONS: 'tempChatSessions',
        MESSAGES: 'tempChatMessages_',
        UNREAD: 'tempChatUnread_',
    };

    // ==================== 临时会话类 ====================
    class TempChat {
        constructor() {
            this.currentUserId = null;
            this.currentSession = null;
            this.ws = null;
            this.wsConnected = false;
            this.reconnectCount = 0;
            this.heartbeatTimer = null;
            this.messageHandlers = [];
            this.sessionList = [];
            this.pendingMessages = [];
        }

        // ==================== 初始化 ====================

        /**
         * 初始化临时会话
         */
        init(options = {}) {
            return new Promise((resolve, reject) => {
                const token = localStorage.getItem('token');
                const userInfoStr = localStorage.getItem('userInfo');
                
                if (!token || !userInfoStr) {
                    reject(new Error('请先登录'));
                    return;
                }

                try {
                    const userInfo = JSON.parse(userInfoStr);
                    this.currentUserId = userInfo.id;
                    STORAGE_KEYS.USER_ID = this.currentUserId;
                } catch (e) {
                    reject(new Error('用户信息解析失败'));
                    return;
                }

                // 连接 WebSocket
                this.connectWebSocket();

                // 标记上线
                this.markOnline();

                // 加载会话列表
                this.loadSessionList();

                resolve();
            });
        }

        /**
         * 销毁实例
         */
        destroy() {
            this.markOffline();
            this.disconnectWebSocket();
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
            }
        }

        // ==================== WebSocket 连接 ====================

        /**
         * 连接 WebSocket
         */
        connectWebSocket() {
            if (this.ws && this.wsConnected) {
                return;
            }

            try {
                // 使用 SockJS
                if (typeof SockJS !== 'undefined') {
                    this.ws = new SockJS(CONFIG.WS_BASE + '/temp-chat');
                } else {
                    // 降级为原生 WebSocket
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    const host = window.location.host;
                    this.ws = new WebSocket(`${protocol}//${host}/ws/temp-chat`);
                }

                this.ws.onopen = () => {
                    console.log('【临时会话】WebSocket 连接成功');
                    this.wsConnected = true;
                    this.reconnectCount = 0;
                    this.startHeartbeat();
                    this.sendPendingMessages();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onclose = (event) => {
                    console.log('【临时会话】WebSocket 连接关闭', event);
                    this.wsConnected = false;
                    this.stopHeartbeat();
                    this.reconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('【临时会话】WebSocket 错误', error);
                };
            } catch (e) {
                console.error('【临时会话】WebSocket 连接失败', e);
                // HTTP 降级
                this.useHttpFallback();
            }
        }

        /**
         * 断开 WebSocket
         */
        disconnectWebSocket() {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.wsConnected = false;
        }

        /**
         * 重连
         */
        reconnect() {
            if (this.reconnectCount >= CONFIG.MAX_RECONNECT) {
                console.warn('【临时会话】达到最大重连次数，停止重连');
                this.useHttpFallback();
                return;
            }

            this.reconnectCount++;
            console.log(`【临时会话】${CONFIG.RECONNECT_INTERVAL/1000}秒后尝试重连... (${this.reconnectCount}/${CONFIG.MAX_RECONNECT})`);

            setTimeout(() => {
                if (!this.wsConnected) {
                    this.connectWebSocket();
                }
            }, CONFIG.RECONNECT_INTERVAL);
        }

        /**
         * 使用 HTTP 降级
         */
        useHttpFallback() {
            console.log('【临时会话】使用 HTTP 轮询降级');
            // 可以实现 HTTP 轮询作为降级方案
        }

        // ==================== 消息处理 ====================

        /**
         * 处理收到的消息
         */
        handleMessage(data) {
            try {
                const msg = JSON.parse(data);
                
                switch (msg.type) {
                    case 'chat':
                        this.handleChatMessage(msg);
                        break;
                    case 'system':
                        this.handleSystemMessage(msg);
                        break;
                    case 'pong':
                        // 心跳响应
                        break;
                    default:
                        console.log('【临时会话】收到未知消息类型', msg);
                }
            } catch (e) {
                console.error('【临时会话】消息解析失败', e);
            }
        }

        /**
         * 处理聊天消息
         */
        handleChatMessage(msg) {
            // 存储消息
            this.saveMessage(msg.sessionId, msg);

            // 触发处理器
            this.messageHandlers.forEach(handler => {
                try {
                    handler(msg);
                } catch (e) {
                    console.error('【临时会话】消息处理器执行失败', e);
                }
            });

            // 更新未读数
            if (msg.to === this.currentUserId) {
                this.incrementUnread(msg.sessionId);
            }
        }

        /**
         * 处理系统消息
         */
        handleSystemMessage(msg) {
            console.log('【临时会话】系统消息:', msg.content);
            
            if (msg.code === 'session_closed') {
                // 会话被关闭
                this.messageHandlers.forEach(handler => {
                    try {
                        handler({ type: 'session_closed', sessionId: msg.sessionId });
                    } catch (e) {}
                });
            }
        }

        /**
         * 发送消息
         */
        send(data) {
            if (this.wsConnected && this.ws) {
                this.ws.send(JSON.stringify(data));
            } else {
                // HTTP 降级
                this.sendViaHttp(data);
            }
        }

        /**
         * 通过 HTTP 发送消息（降级方案）
         */
        async sendViaHttp(data) {
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch(CONFIG.API_BASE + '/temp-chat/sessions/' + data.sessionId + '/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        content: data.content
                    })
                });
                
                const result = await response.json();
                if (result.code === 200) {
                    this.handleChatMessage(result.data);
                }
            } catch (e) {
                console.error('【临时会话】HTTP 发送失败', e);
            }
        }

        /**
         * 发送待发送消息
         */
        sendPendingMessages() {
            while (this.pendingMessages.length > 0) {
                const msg = this.pendingMessages.shift();
                this.send(msg);
            }
        }

        /**
         * 添加消息处理器
         */
        onMessage(handler) {
            this.messageHandlers.push(handler);
            return () => {
                const index = this.messageHandlers.indexOf(handler);
                if (index > -1) {
                    this.messageHandlers.splice(index, 1);
                }
            };
        }

        // ==================== 会话管理 ====================

        /**
         * 创建或获取会话
         */
        async createOrGetSession(otherUserId, productId, productType, productTitle) {
            const token = localStorage.getItem('token');
            
            const response = await fetch(CONFIG.API_BASE + '/temp-chat/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    otherUserId: otherUserId,
                    productId: productId,
                    productType: productType,
                    productTitle: productTitle
                })
            });

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '创建会话失败');
            }

            this.currentSession = result.data;
            return result.data;
        }

        /**
         * 获取会话列表
         */
        async loadSessionList() {
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch(CONFIG.API_BASE + '/temp-chat/sessions', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });

                const result = await response.json();
                if (result.code === 200) {
                    this.sessionList = result.data || [];
                    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessionList));
                }
            } catch (e) {
                console.error('【临时会话】加载会话列表失败', e);
                // 尝试从本地缓存加载
                const cached = localStorage.getItem(STORAGE_KEYS.SESSIONS);
                if (cached) {
                    this.sessionList = JSON.parse(cached);
                }
            }
        }

        /**
         * 获取会话详情
         */
        async getSessionDetail(sessionId) {
            const token = localStorage.getItem('token');
            
            const response = await fetch(CONFIG.API_BASE + '/temp-chat/sessions/' + sessionId, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '获取会话详情失败');
            }

            return result.data;
        }

        /**
         * 关闭会话
         */
        async closeSession(sessionId, reason) {
            const token = localStorage.getItem('token');
            
            const response = await fetch(CONFIG.API_BASE + '/temp-chat/sessions/' + sessionId + '/close', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ reason: reason })
            });

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '关闭会话失败');
            }

            // 移除本地会话
            this.sessionList = this.sessionList.filter(s => s.sessionId !== sessionId);
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessionList));

            return result.data;
        }

        // ==================== 在线状态 ====================

        /**
         * 标记上线
         */
        async markOnline() {
            const token = localStorage.getItem('token');
            
            try {
                await fetch(CONFIG.API_BASE + '/temp-chat/online', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
            } catch (e) {
                console.error('【临时会话】标记上线失败', e);
            }
        }

        /**
         * 标记下线
         */
        async markOffline() {
            const token = localStorage.getItem('token');
            
            try {
                await fetch(CONFIG.API_BASE + '/temp-chat/offline', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
            } catch (e) {
                console.error('【临时会话】标记下线失败', e);
            }
        }

        /**
         * 开始心跳
         */
        startHeartbeat() {
            this.heartbeatTimer = setInterval(() => {
                if (this.wsConnected) {
                    this.send({ type: 'ping' });
                    this.markOnline();
                }
            }, CONFIG.HEARTBEAT_INTERVAL);
        }

        /**
         * 停止心跳
         */
        stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        }

        /**
         * 检查用户是否在线
         */
        async checkOnline(userId) {
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch(CONFIG.API_BASE + '/temp-chat/online/' + userId, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });

                const result = await response.json();
                return result.code === 200 ? result.data.online : false;
            } catch (e) {
                console.error('【临时会话】检查在线状态失败', e);
                return false;
            }
        }

        // ==================== 消息存储 ====================

        /**
         * 保存消息到本地
         */
        saveMessage(sessionId, message) {
            const key = STORAGE_KEYS.MESSAGES + sessionId;
            let messages = this.getMessages(sessionId);
            messages.push(message);
            
            // 限制本地存储消息数量
            if (messages.length > 100) {
                messages = messages.slice(-100);
            }
            
            localStorage.setItem(key, JSON.stringify(messages));
        }

        /**
         * 获取本地消息
         */
        getMessages(sessionId) {
            const key = STORAGE_KEYS.MESSAGES + sessionId;
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : [];
        }

        /**
         * 清除本地消息
         */
        clearMessages(sessionId) {
            const key = STORAGE_KEYS.MESSAGES + sessionId;
            localStorage.removeItem(key);
        }

        // ==================== 未读消息 ====================

        /**
         * 增加未读数
         */
        incrementUnread(sessionId) {
            const key = STORAGE_KEYS.UNREAD + sessionId;
            let count = parseInt(localStorage.getItem(key) || '0');
            localStorage.setItem(key, String(++count));
        }

        /**
         * 获取未读数
         */
        getUnreadCount(sessionId) {
            const key = STORAGE_KEYS.UNREAD + sessionId;
            return parseInt(localStorage.getItem(key) || '0');
        }

        /**
         * 清除未读数
         */
        clearUnread(sessionId) {
            const key = STORAGE_KEYS.UNREAD + sessionId;
            localStorage.setItem(key, '0');
        }

        /**
         * 获取总未读数
         */
        getTotalUnreadCount() {
            let total = 0;
            this.sessionList.forEach(session => {
                total += this.getUnreadCount(session.sessionId);
            });
            return total;
        }

        // ==================== 黑名单 ====================

        /**
         * 添加到黑名单
         */
        async addToBlacklist(userId) {
            const token = localStorage.getItem('token');
            
            const response = await fetch(CONFIG.API_BASE + '/temp-chat/blacklist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ blockedUserId: userId })
            });

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '添加黑名单失败');
            }

            return result.data;
        }

        /**
         * 移除黑名单
         */
        async removeFromBlacklist(userId) {
            const token = localStorage.getItem('token');
            
            const response = await fetch(CONFIG.API_BASE + '/temp-chat/blacklist/' + userId, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.message || '移除黑名单失败');
            }

            return result.data;
        }

        /**
         * 检查是否在黑名单
         */
        async isInBlacklist(userId) {
            const token = localStorage.getItem('token');
            
            const response = await fetch(CONFIG.API_BASE + '/temp-chat/blacklist/check/' + userId, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            const result = await response.json();
            return result.code === 200 && result.data;
        }

        // ==================== 工具方法 ====================

        /**
         * 获取会话列表
         */
        getSessionList() {
            return this.sessionList;
        }

        /**
         * 获取当前会话
         */
        getCurrentSession() {
            return this.currentSession;
        }

        /**
         * 设置当前会话
         */
        setCurrentSession(session) {
            this.currentSession = session;
            if (session) {
                this.clearUnread(session.sessionId);
            }
        }

        /**
         * 格式化时间戳
         */
        formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) { // 1分钟内
                return '刚刚';
            } else if (diff < 3600000) { // 1小时内
                return Math.floor(diff / 60000) + '分钟前';
            } else if (diff < 86400000) { // 1天内
                return Math.floor(diff / 3600000) + '小时前';
            } else if (diff < 604800000) { // 1周内
                return Math.floor(diff / 86400000) + '天前';
            } else {
                return date.toLocaleDateString('zh-CN');
            }
        }
    }

    // ==================== 导出 ====================
    window.TempChat = TempChat;

    // 自动初始化
    window.TempChatManager = {
        instance: null,
        
        getInstance() {
            if (!this.instance) {
                this.instance = new TempChat();
            }
            return this.instance;
        },
        
        init(options) {
            return this.getInstance().init(options);
        },
        
        destroy() {
            if (this.instance) {
                this.instance.destroy();
                this.instance = null;
            }
        }
    };

})(window);
