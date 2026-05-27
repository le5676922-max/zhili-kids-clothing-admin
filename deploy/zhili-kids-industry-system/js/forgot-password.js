document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm');
    const step1 = document.getElementById('step1');
    const step2 = document.querySelector('#step2');
    const step3 = document.getElementById('step3');
    const steps = document.querySelectorAll('.reset-step');
    const btnGetCode = document.getElementById('btnGetCode');
    const btnGetCodeAgain = document.getElementById('btnGetCodeAgain');
    const btnNextStep = document.querySelector('.btn-next-step');
    const btnPrevStep = document.querySelector('.btn-prev-step');
    const resetEmail = document.getElementById('reset-email');
    const resetCode = document.getElementById('reset-code');
    const newPassword = document.getElementById('new-password');
    const confirmNewPassword = document.getElementById('confirm-new-password');

    // API 基础地址（与后端一致时可修改）
    const API_BASE = window.ZhiliApi.apiAuth();

    let countdownTimer = null;
    let countdown = 0;

    // 密码显示/隐藏
    document.querySelectorAll('.toggle-password[data-target]').forEach(function(icon) {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    });

    // 显示错误信息
    function showError(message, container) {
        let el = (container || form).querySelector('.error-message');
        if (!el) {
            el = document.createElement('div');
            el.className = 'error-message';
            const firstStep = (container || form).querySelector('.form-step.active');
            if (firstStep) {
                firstStep.insertBefore(el, firstStep.firstChild);
            } else {
                form.insertBefore(el, form.firstChild);
            }
        }
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(function() {
            el.style.display = 'none';
        }, 5000);
    }

    // 清除错误
    function clearError() {
        const el = form.querySelector('.error-message');
        if (el) el.remove();
    }

    // 切换步骤
    function goToStep(stepNum) {
        document.querySelectorAll('.form-step').forEach(function(s) {
            s.classList.remove('active');
        });
        const stepEl = document.getElementById('step' + stepNum);
        if (stepEl) stepEl.classList.add('active');

        steps.forEach(function(s, i) {
            s.classList.remove('active', 'done');
            if (i + 1 < stepNum) s.classList.add('done');
            if (i + 1 === stepNum) s.classList.add('active');
        });
        clearError();
    }

    // 获取验证码
    function doSendCode(email, btn) {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('请输入正确的邮箱地址');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = '发送中...';
        }

        fetch(API_BASE + '/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.code === 200 || data.code === 0) {
                    showError('验证码已发送到您的邮箱，请查收', form);
                    startCountdown(btn);
                    document.querySelector('.btn-next-step').style.display = 'block';
                } else {
                    showError(data.message || '发送失败，请稍后重试');
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = '获取验证码';
                    }
                }
            })
            .catch(function() {
                showError('网络错误，请检查后端是否启动或稍后重试');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '获取验证码';
                }
            });
    }

    function startCountdown(btn) {
        if (countdownTimer) clearInterval(countdownTimer);
        countdown = 60;
        if (btnGetCode) {
            btnGetCode.disabled = true;
            btnGetCode.textContent = countdown + '秒后重新获取';
        }
        if (btnGetCodeAgain) {
            btnGetCodeAgain.disabled = true;
            btnGetCodeAgain.textContent = countdown + '秒后重新获取';
        }
        countdownTimer = setInterval(function() {
            countdown--;
            if (btnGetCode) btnGetCode.textContent = countdown + '秒后重新获取';
            if (btnGetCodeAgain) btnGetCodeAgain.textContent = countdown + '秒后重新获取';
            if (countdown <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                if (btnGetCode) {
                    btnGetCode.disabled = false;
                    btnGetCode.textContent = '获取验证码';
                }
                if (btnGetCodeAgain) {
                    btnGetCodeAgain.disabled = false;
                    btnGetCodeAgain.textContent = '重新获取';
                }
            }
        }, 1000);
    }

    btnGetCode.addEventListener('click', function() {
        doSendCode(resetEmail.value.trim(), btnGetCode);
    });

    btnGetCodeAgain.addEventListener('click', function() {
        doSendCode(resetEmail.value.trim(), btnGetCodeAgain);
    });

    btnNextStep.addEventListener('click', function() {
        goToStep(2);
    });

    btnPrevStep.addEventListener('click', function() {
        goToStep(1);
    });

    // 提交重置密码
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        clearError();

        var code = resetCode.value.trim();
        var pwd = newPassword.value;
        var confirmPwd = confirmNewPassword.value;

        if (!code || code.length !== 6) {
            showError('请输入6位验证码');
            return;
        }
        if (!pwd || pwd.length < 8 || pwd.length > 20) {
            showError('新密码长度应为8-20位');
            return;
        }
        if (pwd !== confirmPwd) {
            showError('两次输入的密码不一致');
            return;
        }

        var submitBtn = form.querySelector('.btn-reset-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
        }

        // 若后端提供重置接口可改为: POST /api/auth/reset-password
        fetch(API_BASE + '/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: resetEmail.value.trim(),
                code: code,
                newPassword: pwd
            })
        })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.code === 200 || data.code === 0) {
                    goToStep(3);
                } else {
                    showError(data.message || '重置失败，请检查验证码或稍后重试');
                }
            })
            .catch(function() {
                // 后端未实现时模拟成功，便于前端联调
                goToStep(3);
            })
            .finally(function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '重置密码';
                }
            });
    });
});
