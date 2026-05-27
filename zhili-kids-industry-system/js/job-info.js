// 信息页：联系人列表 + WebSocket 实时聊天 + 未读红点 + 消息提示音
(function () {
    var API_BASE = window.ZhiliApi.apiRoot();
    var WS_SOCKJS_URL = window.ZhiliApi.sockJsHttpBase();

    function getToken() { return localStorage.getItem('token'); }
    function getUserInfo() {
        try { var raw = localStorage.getItem('userInfo'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }

    var currentUserId = null;
    var currentOther = null;
    var contacts = [];
    var stompClient = null;
    var subscription = null;

    // ─── 提示音：Web Audio API 生成短「叮」声，无需外部文件 ───────────────────────────
    function playNotificationSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.18);
            ctx.close && setTimeout(function () { ctx.close(); }, 250);
        } catch (e) { /* 静默失败，不影响聊天 */ }
    }

    // ─── 全局未读计数同步（sessionStorage，供其他页面共享）────────────────────────────
    var _globalUnread = 0;
    function setGlobalUnread(count) {
        _globalUnread = count;
        try { sessionStorage.setItem('chatUnreadCount', String(count)); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('chatUnreadUpdated', { detail: { count: count } })); } catch (e) {}
    }
    function getGlobalUnread() { return _globalUnread; }

    // ─── 时间格式化 ────────────────────────────────────────────────────────────────
    function formatTime(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        }
        return d.getMonth() + 1 + '/' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }

    // ─── 加载未读总数（初始化 + 每次收到新消息后刷新）────────────────────────────────
    function refreshGlobalUnread() {
        var token = getToken();
        if (!token) return;
        fetch(API_BASE + '/auth/chat/unread-count', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result.code === 200 && result.data != null) {
                    setGlobalUnread(result.data);
                }
            })
            .catch(function () {});
    }

    // ─── WebSocket 连接 ───────────────────────────────────────────────────────────
    function connectWebSocket() {
        var token = getToken();
        if (!token || !currentUserId) return;
        if (stompClient && stompClient.connected) return;
        var socket = new SockJS(WS_SOCKJS_URL);
        stompClient = Stomp.over(socket);
        stompClient.connect({ 'Authorization': 'Bearer ' + token, 'token': token }, function () {
            subscription = stompClient.subscribe('/topic/chat/user/' + currentUserId, function (msg) {
                var body = JSON.parse(msg.body);
                // 发送方是自己 → 不提示；接收方是当前选中的联系人 → 直接追加
                var isFromCurrentOther = currentOther && body.senderId === currentOther.otherUserId;
                var isToCurrentOther = currentOther && body.receiverId === currentOther.otherUserId;
                if (isFromCurrentOther || isToCurrentOther) {
                    appendMessage(body);
                } else {
                    // 来自其他人的消息：播放铃声 + 更新联系人红点 + 刷新全局未读
                    playNotificationSound();
                    refreshContactLastMessage(body, true);
                    refreshGlobalUnread();
                }
            });
        }, function () {
            console.error('WebSocket 连接失败');
        });
    }

    // ─── 收到消息时更新联系人列表（最后一条消息 + 未读红点）──────────────────────────
    function refreshContactLastMessage(msg, isUnread) {
        var otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        var found = false;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].otherUserId === otherId) {
                contacts[i].lastContent = msg.content;
                contacts[i].lastTime = msg.createdAt;
                if (isUnread && msg.senderId !== currentUserId) {
                    contacts[i].unreadCount = (contacts[i].unreadCount || 0) + 1;
                }
                found = true;
                break;
            }
        }
        if (!found) {
            // 收到新联系人的消息，插入头部
            contacts.unshift({
                otherUserId: otherId,
                otherNickname: '用户',
                unreadCount: isUnread && msg.senderId !== currentUserId ? 1 : 0,
                lastContent: msg.content,
                lastTime: msg.createdAt
            });
        }
        renderContactsList();
    }

    // ─── 追加消息气泡 ─────────────────────────────────────────────────────────────
    function appendMessage(m) {
        var fromMe = m.fromMe === true || m.senderId === currentUserId;
        var time = (m.createdAt && typeof m.createdAt === 'string' && m.createdAt.indexOf('T') !== -1)
            ? formatTime(m.createdAt)
            : (m.createdAt || formatTime(new Date()));
        var bubble = document.createElement('div');
        bubble.className = 'msg-item' + (fromMe ? ' from-me' : '');
        bubble.innerHTML = '<div class="bubble">' + (m.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div><div class="time">' + time + '</div>';
        var container = document.getElementById('chatMessages');
        var empty = document.getElementById('chatEmpty');
        if (empty) empty.style.display = 'none';
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    // ─── 加载联系人列表 ───────────────────────────────────────────────────────────
    function loadContacts() {
        var listEl = document.getElementById('contactsList');
        var token = getToken();
        if (!token) {
            listEl.innerHTML = '<div class="no-contacts">请先<a href="login.html?redirect=' + encodeURIComponent('job-info.html') + '">登录</a></div>';
            return;
        }
        fetch(API_BASE + '/auth/chat/contacts', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result.code !== 200 || !result.data) {
                    listEl.innerHTML = '<div class="no-contacts">暂无联系人，可从招聘页点击「沟通」开始</div>';
                    return;
                }
                contacts = result.data || [];
                var params = new URLSearchParams(window.location.search);
                var enterpriseId = params.get('enterpriseId');
                var jobId = params.get('jobId');
                var jobName = params.get('jobName') ? decodeURIComponent(params.get('jobName')) : '';
                if (enterpriseId) {
                    var found = null;
                    for (var i = 0; i < contacts.length; i++) {
                        if (contacts[i].otherUserId === enterpriseId) { found = contacts[i]; break; }
                    }
                    if (!found) {
                        contacts.unshift({ otherUserId: enterpriseId, otherNickname: '企业用户', jobId: jobId ? parseInt(jobId, 10) : null, jobName: jobName, lastContent: '', lastTime: null, unreadCount: 0 });
                    }
                    renderContactsList();
                    selectContact(found || { otherUserId: enterpriseId, otherNickname: '企业用户', jobId: jobId ? parseInt(jobId, 10) : null, jobName: jobName, connectionId: null });
                } else {
                    renderContactsList();
                }
                refreshGlobalUnread();
            })
            .catch(function () {
                listEl.innerHTML = '<div class="no-contacts">加载失败</div>';
            });
    }

    // ─── 渲染联系人列表（含未读红点）───────────────────────────────────────────────
    function renderContactsList() {
        var listEl = document.getElementById('contactsList');
        if (!contacts || contacts.length === 0) {
            listEl.innerHTML = '<div class="no-contacts">暂无联系人</div>';
            return;
        }
        var activeId = currentOther ? currentOther.otherUserId : null;
        listEl.innerHTML = contacts.map(function (c) {
            var unread = c.unreadCount > 0;
            var unreadLabel = unread ? (c.unreadCount > 99 ? '99+' : c.unreadCount) : '';
            var avatar = (c.otherAvatar && c.otherAvatar.trim())
                ? ('<img class="avatar" src="' + String(c.otherAvatar).replace(/"/g, '&quot;') + '" alt="">')
                : '<div class="avatar" style="background:#ddd;display:flex;align-items:center;justify-content:center;color:#666;font-size:18px;"><i class="bi bi-person"></i></div>';
            var dot = unread
                ? '<span class="avatar-unread-dot' + (c.unreadCount > 9 ? ' large' : '') + '">' + unreadLabel + '</span>'
                : '';
            return '<div class="contact-item' + (c.otherUserId === activeId ? ' active' : '') + '" data-other-id="' + (c.otherUserId || '').replace(/"/g, '&quot;') + '" data-other-name="' + (c.otherNickname || '').replace(/"/g, '&quot;') + '" data-job-id="' + (c.jobId != null ? c.jobId : '') + '" data-job-name="' + (c.jobName || '').replace(/"/g, '&quot;') + '" data-connection-id="' + (c.connectionId != null ? c.connectionId : '') + '">' +
                '<div class="avatar-wrap">' + avatar + dot + '</div>' +
                '<div style="flex:1;min-width:0;"><div class="name">' + (c.otherNickname || '用户').replace(/</g, '&lt;') + '</div>' +
                (c.jobName ? '<div class="job-name">' + (c.jobName || '').replace(/</g, '&lt;') + '</div>' : '') +
                '<div class="last-msg">' + (c.lastContent || '').replace(/</g, '&lt;').substring(0, 30) + '</div></div></div>';
        }).join('');
        listEl.querySelectorAll('.contact-item').forEach(function (el) {
            el.addEventListener('click', function () {
                selectContact({
                    otherUserId: this.getAttribute('data-other-id'),
                    otherNickname: this.getAttribute('data-other-name') || '用户',
                    jobId: this.getAttribute('data-job-id') ? parseInt(this.getAttribute('data-job-id'), 10) : null,
                    jobName: this.getAttribute('data-job-name') || '',
                    connectionId: this.getAttribute('data-connection-id') ? parseInt(this.getAttribute('data-connection-id'), 10) : null
                });
            });
        });
    }

    // ─── 选中联系人 ───────────────────────────────────────────────────────────────
    function selectContact(other) {
        currentOther = other;
        renderContactsList();
        document.getElementById('chatHeader').style.display = 'block';
        document.getElementById('chatTitle').textContent = other.otherNickname || '用户';
        document.getElementById('chatJobTag').textContent = other.jobName ? '· ' + other.jobName : '';
        document.getElementById('chatForm').style.display = 'flex';
        var container = document.getElementById('chatMessages');
        container.innerHTML = '';
        var empty = document.createElement('div');
        empty.id = 'chatEmpty';
        empty.className = 'info-chat-empty';
        empty.style.display = 'block';
        empty.textContent = '加载中...';
        container.appendChild(empty);
        var token = getToken();
        if (token && other.otherUserId) {
            // 标记已读
            var payload = { otherUserId: other.otherUserId };
            if (other.jobId != null) payload.jobId = other.jobId;
            if (other.connectionId != null) payload.connectionId = other.connectionId;
            fetch(API_BASE + '/auth/chat/mark-read', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function () {
                // 已读后清除该联系人的未读红点并刷新全局计数
                for (var i = 0; i < contacts.length; i++) {
                    if (contacts[i].otherUserId === other.otherUserId) {
                        contacts[i].unreadCount = 0;
                        break;
                    }
                }
                renderContactsList();
                refreshGlobalUnread();
            }).catch(function () {});
        }
        var url = API_BASE + '/auth/chat/messages?otherUserId=' + encodeURIComponent(other.otherUserId);
        if (other.jobId != null) url += '&jobId=' + other.jobId;
        fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                empty.style.display = 'none';
                if (result.code === 200 && result.data && result.data.length) {
                    result.data.forEach(function (m) {
                        appendMessage({
                            senderId: m.senderId,
                            receiverId: m.receiverId,
                            content: m.content,
                            createdAt: m.createdAt,
                            fromMe: m.fromMe
                        });
                    });
                } else {
                    container.appendChild(empty);
                    empty.style.display = 'block';
                    empty.textContent = '暂无消息，输入内容开始沟通';
                }
            })
            .catch(function () {
                empty.style.display = 'block';
                empty.textContent = '加载失败';
            });
    }

    // ─── 发送消息 ────────────────────────────────────────────────────────────────
    function sendMessage() {
        var input = document.getElementById('chatInput');
        var content = (input && input.value) ? input.value.trim() : '';
        if (!content) { alert('请输入消息内容'); return; }
        if (!currentOther) { alert('请先选择联系人'); return; }
        var token = getToken();
        if (!token) { alert('请先登录'); return; }
        var payload = { toUserId: currentOther.otherUserId, content: content };
        if (currentOther.jobId != null) payload.jobId = currentOther.jobId;
        var sendBtn = document.getElementById('chatSend');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '发送中...'; }
        fetch(API_BASE + '/auth/chat/send', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
                if (result.code === 200 && result.data) {
                    input.value = '';
                    var m = result.data;
                    var timeStr = (typeof m.createdAt === 'string' && m.createdAt) ? m.createdAt : formatTime(new Date());
                    appendMessage({ senderId: m.senderId, receiverId: m.receiverId, content: m.content || content, createdAt: timeStr, fromMe: true });
                } else {
                    alert(result.message || '发送失败');
                }
            })
            .catch(function (err) {
                if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
                alert('发送失败：' + (err.message || '网络错误'));
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var userInfo = getUserInfo();
        if (!userInfo || !userInfo.id) {
            document.getElementById('contactsList').innerHTML = '<div class="no-contacts">请先<a href="login.html?redirect=' + encodeURIComponent('job-info.html') + '">登录</a></div>';
            return;
        }
        currentUserId = userInfo.id;
        loadContacts();
        connectWebSocket();
        var sendBtn = document.getElementById('chatSend');
        var chatInput = document.getElementById('chatInput');
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (chatInput) chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
    });
})();
