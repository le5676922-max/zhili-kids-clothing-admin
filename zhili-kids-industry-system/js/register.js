document.addEventListener('DOMContentLoaded', function() {
    // 步骤切换功能
    const steps = document.querySelectorAll('.register-steps .step');
    const formSteps = document.querySelectorAll('.form-step');
    const btnNext = document.querySelector('.btn-next');
    const btnPrev = document.querySelector('.btn-prev');
    const btnSubmit = document.querySelector('.btn-submit');
    
    let currentStep = 0;
    
    // API 基础地址
    const API_BASE = window.ZhiliApi.apiAuth();
    
    // 存储上传后的营业执照 URL
    let licenseImageUrl = '';
    
    // 下一步按钮点击事件
    if (btnNext) {
        btnNext.addEventListener('click', function() {
            // 表单验证
            if (!validateStep1()) {
                return;
            }
            
            // 切换到下一步
            currentStep++;
            updateSteps();
            
            // 如果选择了企业用户，显示企业信息表单
            const userType = document.querySelector('input[name="user-type"]:checked').value;
            const enterpriseInfo = document.querySelector('.enterprise-info');
            if (userType === 'enterprise' && enterpriseInfo) {
                enterpriseInfo.style.display = 'block';
            } else if (enterpriseInfo) {
                enterpriseInfo.style.display = 'none';
            }
        });
    }
    
    // 上一步按钮点击事件
    if (btnPrev) {
        btnPrev.addEventListener('click', function() {
            currentStep--;
            updateSteps();
        });
    }
    
    // 提交按钮点击事件
    if (btnSubmit) {
        btnSubmit.addEventListener('click', function() {
            // 表单验证
            if (!validateStep2()) {
                return;
            }
            
            // 提交注册
            doRegister();
        });
    }
    
    // 更新步骤显示
    function updateSteps() {
        // 更新步骤指示器
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
            } else if (index < currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // 更新表单步骤
        formSteps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
    
    // 步骤1表单验证（与 register.html 一致：邮箱、密码、确认密码、用户类型）
    function validateStep1() {
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        const confirmPasswordEl = document.getElementById('confirm-password');
        if (!emailEl || !passwordEl || !confirmPasswordEl) return false;

        const email = emailEl.value.trim();
        const password = passwordEl.value;
        const confirmPassword = confirmPasswordEl.value;

        // 邮箱验证
        if (!email) {
            showError('请输入邮箱账号');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('请输入正确的邮箱格式');
            return false;
        }

        // 密码验证
        if (!password) {
            showError('请输入密码');
            return false;
        }
        if (password.length < 8 || password.length > 20) {
            showError('密码长度应为8-20个字符');
            return false;
        }

        // 确认密码验证
        if (!confirmPassword) {
            showError('请再次输入密码');
            return false;
        }
        if (password !== confirmPassword) {
            showError('两次输入的密码不一致');
            return false;
        }

        return true;
    }
    
    // 步骤2表单验证
    function validateStep2() {
        const verificationCode = document.getElementById('verification-code').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        const userType = document.querySelector('input[name="user-type"]:checked').value;
        
        // 验证码验证
        if (!verificationCode) {
            showError('请输入验证码');
            return false;
        } else if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
            showError('请输入6位数字验证码');
            return false;
        }
        
        // 企业用户额外验证
        if (userType === 'enterprise') {
            const entNameEl = document.getElementById('enterprise-name');
            const entLicenseEl = document.getElementById('enterprise-license');
            const licenseUploadEl = document.getElementById('enterprise-license-upload');
            const enterpriseName = entNameEl ? entNameEl.value.trim() : '';
            const enterpriseLicense = entLicenseEl ? entLicenseEl.value.trim() : '';
            const hasFile = licenseUploadEl && licenseUploadEl.files && licenseUploadEl.files.length > 0;

            if (!enterpriseName) {
                showError('请输入企业名称');
                return false;
            }
            if (!enterpriseLicense) {
                showError('请输入营业执照号码');
                return false;
            }
            if (!hasFile) {
                showError('请选择营业执照文件并上传');
                return false;
            }
            if (!licenseImageUrl) {
                showError('请等待营业执照上传完成后再提交');
                return false;
            }
        }
        
        // 协议同意验证
        if (!agreeTerms) {
            showError('请阅读并同意用户协议和隐私政策');
            return false;
        }
        
        return true;
    }
    
    // 显示错误信息
    function showError(message) {
        // 检查是否已存在错误消息元素
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
            
            // 插入到当前活动表单步骤的顶部
            const activeStep = document.querySelector('.form-step.active');
            if (activeStep) {
                activeStep.insertBefore(errorElement, activeStep.firstChild);
            }
        }
        
        // 设置错误消息
        errorElement.textContent = message;
        
        // 5秒后自动隐藏
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    // 显示成功信息
    function showSuccess(message) {
        let successElement = document.querySelector('.success-message');
        
        if (!successElement) {
            successElement = document.createElement('div');
            successElement.className = 'success-message';
            successElement.style.color = '#38a169';
            successElement.style.fontSize = '14px';
            successElement.style.marginTop = '10px';
            successElement.style.padding = '10px';
            successElement.style.backgroundColor = '#f0fff4';
            successElement.style.borderRadius = '4px';
            successElement.style.borderLeft = '3px solid #38a169';
            
            const activeStep = document.querySelector('.form-step.active');
            if (activeStep) {
                activeStep.insertBefore(successElement, activeStep.firstChild);
            }
        }
        
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
    
    // 提交注册（与后端 RegisterRequest 一致：email, password, confirmPassword, code, userType）
    async function doRegister() {
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        const confirmPasswordEl = document.getElementById('confirm-password');
        const verificationCodeEl = document.getElementById('verification-code');
        if (!emailEl || !passwordEl || !confirmPasswordEl || !verificationCodeEl) {
            showError('请完善注册信息');
            return;
        }

        const email = emailEl.value.trim();
        const password = passwordEl.value;
        const confirmPassword = confirmPasswordEl.value;
        const verificationCode = verificationCodeEl.value.trim();
        const userTypeRadio = document.querySelector('input[name="user-type"]:checked');
        const isEnterprise = userTypeRadio && userTypeRadio.value === 'enterprise';
        const userType = isEnterprise ? 2 : 1;

        btnSubmit.textContent = '提交中...';
        btnSubmit.disabled = true;

        const registerData = {
            email: email,
            password: password,
            confirmPassword: confirmPassword,
            code: verificationCode,
            userType: userType
        };

        if (isEnterprise) {
            const entName = document.getElementById('enterprise-name');
            const entLicense = document.getElementById('enterprise-license');
            if (entName) registerData.enterpriseName = entName.value;
            if (entLicense) registerData.enterpriseLicense = entLicense.value;
            if (licenseImageUrl) registerData.licenseImageUrl = licenseImageUrl;
        }

        try {
            const response = await fetch(API_BASE + '/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            });
            
            const data = await response.json();
            
            if (data.code === 200 || data.code === 0) {
                // 注册成功
                if (data.data && data.data.token) {
                    localStorage.setItem('token', data.data.token);
                    if (data.data.userInfo) {
                        localStorage.setItem('userInfo', JSON.stringify(data.data.userInfo));
                    }
                }
                if (typeof window.renderAuthHeader === 'function') window.renderAuthHeader();
                showSuccess('注册成功！');

                // 企业用户注册：显示待审核提示
                if (isEnterprise) {
                    var successMsgEl = document.getElementById('registerSuccessMsg');
                    if (successMsgEl) {
                        successMsgEl.textContent = '您的企业账号已提交，需等待管理员审核通过后方可使用招聘、发布商品等企业功能。';
                    }
                }

                // 跳转到首页或登录页
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, isEnterprise ? 3000 : 1500);
            } else {
                showError(data.message || '注册失败，请稍后重试');
                btnSubmit.textContent = '提交注册';
                btnSubmit.disabled = false;
            }
        } catch (err) {
            console.error('注册失败:', err);
            showError('网络错误，请检查后端服务是否启动');
            btnSubmit.textContent = '提交注册';
            btnSubmit.disabled = false;
        }
    }
    
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
    
    // 获取验证码按钮功能（发送到步骤1填写的邮箱）
    const btnGetCode = document.querySelector('.btn-get-code');
    if (btnGetCode) {
        btnGetCode.addEventListener('click', async function() {
            const emailEl = document.getElementById('email');
            if (!emailEl) return;
            const email = emailEl.value.trim();
            if (!email) {
                showError('请先在第一步填写邮箱账号');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showError('请输入正确的邮箱格式');
                return;
            }

            const btn = this;
            btn.disabled = true;
            let countdown = 60;
            btn.textContent = countdown + '秒后重新获取';

            try {
                const res = await fetch(API_BASE + '/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                const data = await res.json();
                if (data.code === 200 || data.code === 0) {
                    showSuccess('验证码已发送到您的邮箱');
                } else {
                    showError(data.message || '发送验证码失败');
                    btn.disabled = false;
                    btn.textContent = '发送验证码';
                    return;
                }
            } catch (err) {
                console.error(err);
                showError('网络错误，请检查后端是否启动（端口8080）');
                btn.disabled = false;
                btn.textContent = '发送验证码';
                return;
            }

            const timer = setInterval(() => {
                countdown--;
                btn.textContent = countdown + '秒后重新获取';
                if (countdown <= 0) {
                    clearInterval(timer);
                    btn.disabled = false;
                    btn.textContent = '发送验证码';
                }
            }, 1000);
        });
    }
    
    // 营业执照上传功能 - 使用 OSS 直传
    const fileUpload = document.getElementById('enterprise-license-upload');
    const fileName = document.querySelector('.file-name');
    const licenseUploadStatus = document.querySelector('.license-upload-status');
    
    if (fileUpload && fileName) {
        fileUpload.addEventListener('change', async function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                fileName.textContent = file.name;
                
                // 显示上传状态
                if (licenseUploadStatus) {
                    licenseUploadStatus.textContent = '上传中...';
                    licenseUploadStatus.className = 'license-upload-status uploading';
                }
                
                try {
                    // 与头像一致：优先 OSS 直传（存入 yingyezhizhao-zhili-kids-system），失败则经后端上传
                    licenseImageUrl = await window.OssUploader.uploadLicenseWithFallback(file);
                    if (licenseUploadStatus) {
                        licenseUploadStatus.textContent = '上传成功';
                        licenseUploadStatus.className = 'license-upload-status success';
                    }
                } catch (err) {
                    console.error('营业执照上传失败:', err);
                    licenseImageUrl = '';
                    if (licenseUploadStatus) {
                        licenseUploadStatus.textContent = '上传失败: ' + (err.message || '请重试');
                        licenseUploadStatus.className = 'license-upload-status error';
                    }
                }
            } else {
                fileName.textContent = '';
                licenseImageUrl = '';
                if (licenseUploadStatus) {
                    licenseUploadStatus.textContent = '';
                    licenseUploadStatus.className = 'license-upload-status';
                }
            }
        });
    }
    
    // 用户类型切换
    const userTypeRadios = document.querySelectorAll('input[name="user-type"]');
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // 在步骤1中预览企业信息表单的显示/隐藏状态
            if (currentStep === 0) {
                const enterpriseInfo = document.querySelector('.enterprise-info');
                if (!enterpriseInfo) return;
                
                if (this.value === 'enterprise') {
                    // 创建预览提示
                    let previewTip = document.querySelector('.enterprise-preview-tip');
                    if (!previewTip) {
                        previewTip = document.createElement('div');
                        previewTip.className = 'enterprise-preview-tip';
                        previewTip.style.marginTop = '15px';
                        previewTip.style.padding = '10px';
                        previewTip.style.backgroundColor = '#ebf8ff';
                        previewTip.style.borderRadius = '4px';
                        previewTip.style.fontSize = '14px';
                        previewTip.style.color = '#2b6cb0';
                        previewTip.innerHTML = '<i class="bi bi-info-circle"></i> 选择企业用户后，下一步将需要填写企业相关信息';
                        
                        const radioGroup = document.querySelector('.radio-group');
                        radioGroup.parentNode.insertBefore(previewTip, radioGroup.nextSibling);
                    }
                } else {
                    // 移除预览提示
                    const previewTip = document.querySelector('.enterprise-preview-tip');
                    if (previewTip) {
                        previewTip.remove();
                    }
                }
            }
        });
    });
}); 
