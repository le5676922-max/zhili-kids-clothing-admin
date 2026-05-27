/**
 * 修改密码：原密码方式 + 通过邮箱方式（跳转忘记密码页）
 */
document.addEventListener('DOMContentLoaded', function() {
    var TOKEN_KEY = 'token';
    var USER_INFO_KEY = 'userInfo';
    var API_BASE = window.ZhiliApi.apiAuth();

    var formByOld = document.getElementById('formByOld');
    var oldPassword = document.getElementById('old-password');
    var newPassword = document.getElementById('new-password');
    var confirmPassword = document.getElementById('confirm-password');
    var errorEl = document.getElementById('error-message');
    var btnSubmit = document.getElementById('btnSubmitOld');
    var panelByOld = document.getElementById('panel-by-old');
    var panelByEmail = document.getElementById('panel-by-email');
    var panelSuccess = document.getElementById('panel-success');
    var tabs = document.querySelectorAll('.change-password-tabs .tab-btn');

    // 未登录则跳转登录页
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        var path = window.location.pathname || '';
        var loginUrl = path.indexOf('pages') >= 0 ? 'login.html' : 'pages/login.html';
        window.location.href = loginUrl;
        return;
    }

    // 密码显示/隐藏
    document.querySelectorAll('.toggle-password[data-target]').forEach(function(icon) {
        icon.addEventListener('click', function() {
            var targetId = this.getAttribute('data-target');
            var input = document.getElementById(targetId);
            if (!input) return;
            var type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    });

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
    }

    function clearError() {
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    // 切换标签
    tabs.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tab = this.getAttribute('data-tab');
            tabs.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            panelByOld.classList.remove('active');
            panelByEmail.classList.remove('active');
            panelSuccess.style.display = 'none';
            if (tab === 'by-old') {
                panelByOld.classList.add('active');
            } else {
                panelByEmail.classList.add('active');
            }
            clearError();
        });
    });

    // 原密码方式提交
    formByOld.addEventListener('submit', function(e) {
        e.preventDefault();
        clearError();

        var oldPwd = (oldPassword && oldPassword.value) || '';
        var newPwd = (newPassword && newPassword.value) || '';
        var confirmPwd = (confirmPassword && confirmPassword.value) || '';

        if (!oldPwd) {
            showError('请输入原密码');
            return;
        }
        if (!newPwd || newPwd.length < 8 || newPwd.length > 20) {
            showError('新密码长度应为8-20位');
            return;
        }
        if (newPwd !== confirmPwd) {
            showError('两次输入的新密码不一致');
            return;
        }
        if (oldPwd === newPwd) {
            showError('新密码不能与原密码相同');
            return;
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = '提交中...';
        }

        fetch(API_BASE + '/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem(TOKEN_KEY)
            },
            body: JSON.stringify({
                oldPassword: oldPwd,
                newPassword: newPwd
            })
        })
            .then(function(res) {
                if (res.status === 401) {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_INFO_KEY);
                    window.location.href = 'login.html';
                    return Promise.reject(new Error('未登录'));
                }
                return res.json();
            })
            .then(function(data) {
                if (data.code === 200 || data.code === 0) {
                    panelByOld.classList.remove('active');
                    panelByEmail.classList.remove('active');
                    var tabsWrap = document.querySelector('.change-password-tabs');
                    if (tabsWrap) tabsWrap.style.display = 'none';
                    panelSuccess.style.display = '';
                    panelSuccess.classList.add('active');
                    // 修改成功后清除登录状态，要求用新密码重新登录
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_INFO_KEY);
                } else {
                    showError(data.message || '修改失败，请检查原密码是否正确');
                }
            })
            .catch(function() {
                showError('网络错误，请检查后端是否启动或稍后重试');
            })
            .finally(function() {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = '确认修改';
                }
            });
    });
});
