/**
 * 客服消息存储（localStorage，用户端与管理员端共用）
 * 键: zhili_cs_conversations
 * 值: { [conversationId]: { userName, userEmail?, messages: [{ from, content, time }] } }
 */
(function () {
  var STORAGE_KEY = 'zhili_cs_conversations';
  var GUEST_PREFIX = 'guest_';
  var USER_PREFIX = 'user_';

  function getConversations() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function setConversations(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  /** 获取当前用户会话ID（用户端调用） */
  function getCurrentConversationId() {
    var userInfo = null;
    try {
      var raw = localStorage.getItem('userInfo') || localStorage.getItem('adminUserInfo');
      if (raw) userInfo = JSON.parse(raw);
    } catch (e) {}
    if (userInfo && userInfo.email) {
      return USER_PREFIX + userInfo.email;
    }
    var sid = sessionStorage.getItem('zhili_cs_guest_id');
    if (!sid) {
      sid = GUEST_PREFIX + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem('zhili_cs_guest_id', sid);
    }
    return sid;
  }

  /** 获取当前用户显示名（用户端） */
  function getCurrentUserName() {
    var userInfo = null;
    try {
      var raw = localStorage.getItem('userInfo') || localStorage.getItem('adminUserInfo');
      if (raw) userInfo = JSON.parse(raw);
    } catch (e) {}
    if (userInfo && userInfo.nickname) return userInfo.nickname;
    if (userInfo && userInfo.email) return userInfo.email;
    return '访客';
  }

  /** 用户端：获取我的会话消息列表 */
  window.CustomerServiceGetMyMessages = function () {
    var cid = getCurrentConversationId();
    var all = getConversations();
    var conv = all[cid];
    return conv && conv.messages ? conv.messages : [];
  };

  /** 用户端：发送一条用户消息 */
  window.CustomerServiceSendUserMessage = function (content) {
    if (!content || !String(content).trim()) return;
    var cid = getCurrentConversationId();
    var name = getCurrentUserName();
    var all = getConversations();
    if (!all[cid]) {
      all[cid] = { userName: name, userEmail: (name.indexOf('@') !== -1 ? name : null), messages: [] };
    }
    all[cid].userName = name;
    all[cid].messages.push({
      from: 'user',
      content: String(content).trim(),
      time: new Date().toISOString()
    });
    setConversations(all);
  };

  /** 管理端：获取所有会话列表 */
  window.CustomerServiceGetAllConversations = function () {
    return getConversations();
  };

  /** 管理端：获取某会话的消息列表 */
  window.CustomerServiceGetMessages = function (conversationId) {
    var all = getConversations();
    var conv = all[conversationId];
    return conv && conv.messages ? conv.messages : [];
  };

  /** 管理端：管理员回复某会话 */
  window.CustomerServiceSendAdminReply = function (conversationId, content) {
    if (!conversationId || !content || !String(content).trim()) return;
    var all = getConversations();
    if (!all[conversationId]) all[conversationId] = { userName: '未知', messages: [] };
    all[conversationId].messages.push({
      from: 'admin',
      content: String(content).trim(),
      time: new Date().toISOString()
    });
    setConversations(all);
  };
})();
