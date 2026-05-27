document.addEventListener('DOMContentLoaded', function() {
    // 密码显示/隐藏功能
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // 切换密码显示类型
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 切换图标
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    }
    
    // API 基础地址（与 ZhiliApi 一致，见 auth-header.js）
    if (!window.ZhiliApi || typeof window.ZhiliApi.apiAuth !== 'function') {
        console.error('ZhiliApi 未加载，请确保 auth-header.js 在 login.js 之前引入');
        return;
    }
    const API_BASE = window.ZhiliApi.apiAuth();

    // 登录表单提交
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 从当前表单内获取（避免与首页等其它页面冲突）
            const emailEl = loginForm.querySelector('#email') || document.getElementById('email');
            const passwordEl = loginForm.querySelector('#password') || document.getElementById('password');
            const rememberEl = loginForm.querySelector('#remember') || document.getElementById('remember');
            if (!emailEl || !passwordEl) {
                showError('页面元素未加载完整，请刷新后重试');
                return;
            }
            const email = (emailEl.value || '').trim();
            const password = passwordEl.value || '';
            const remember = rememberEl ? rememberEl.checked : false;

            // 表单验证
            if (!email) {
                showError('请输入邮箱');
                return;
            }

            if (!password) {
                showError('请输入密码');
                return;
            }

            // 调用后端登录接口
            doLogin(email, password, remember);
        });
    }

    // 执行登录
    function doLogin(email, password, remember) {
        const loginButton = document.querySelector('.btn-login-submit');
        if (!loginButton) {
            showError('页面元素未加载完整，请刷新后重试');
            return;
        }
        const originalText = loginButton.textContent;
        loginButton.textContent = '登录中...';
        loginButton.disabled = true;

        fetch(API_BASE + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                rememberMe: remember
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.code === 200 || data.code === 0) {
                // 登录成功，保存 token 和用户信息
                var userInfo = null;
                if (data.data && data.data.token) {
                    localStorage.setItem('token', data.data.token);
                    // 优先使用 userInfo 字段（后端返回的），其次使用 user 字段
                    if (data.data.userInfo) {
                        userInfo = data.data.userInfo;
                    } else if (data.data.user) {
                        userInfo = data.data.user;
                    }
                    if (userInfo) {
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                    }
                }

                // 根据用户角色跳转到对应页面
                var redirectUrl = '../index.html'; // 默认跳转到首页
                if (userInfo && userInfo.isAdmin === true) {
                    redirectUrl = 'admin-system.html'; // 管理员跳转到后台（与 login.html 同目录）
                }

                // 弹出登录成功提示后跳转
                alert('登录成功');
                window.location.href = redirectUrl;
            } else {
                // 登录失败
                showError(data.message || '邮箱或密码错误');
                loginButton.textContent = originalText;
                loginButton.disabled = false;
            }
        })
        .catch(function(err) {
            console.error('登录失败:', err);
            showError('登录失败：请确认 1) 后端已启动（java 目录下运行） 2) 若用 file:// 打开页面，请用本地服务器打开（如 VS Code Live Server）');
            loginButton.textContent = originalText;
            loginButton.disabled = false;
        });
    }

    // 显示错误信息
    function showError(message) {
        let errorElement = document.querySelector('.error-message');
        
        if (!errorElement) {
            // 创建错误消息元素
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            
            // 添加样式
            errorElement.style.color = '#e53e3e';
            errorElement.style.fontSize = '14px';
            errorElement.style.marginTop = '10px';
            errorElement.style.padding = '10px';
            errorElement.style.backgroundColor = '#fff5f5';
            errorElement.style.borderRadius = '4px';
            errorElement.style.borderLeft = '3px solid #e53e3e';
            
            // 插入到表单顶部（防御性检查）
            if (loginForm && loginForm.firstChild) {
                loginForm.insertBefore(errorElement, loginForm.firstChild);
            } else if (loginForm) {
                loginForm.appendChild(errorElement);
            } else {
                // 如果表单不存在，直接 alert
                alert(message);
                return;
            }
        }
        
        // 设置错误消息
        errorElement.textContent = message;
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (errorElement) errorElement.style.display = 'none';
        }, 5000);
    }
}); 