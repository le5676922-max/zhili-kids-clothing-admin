/**
 * 个人中心：展示并修改用户昵称、头像等个人信息，头像上传到阿里云 OSS
 */
document.addEventListener('DOMContentLoaded', function() {
    var TOKEN_KEY = 'token';
    var USER_INFO_KEY = 'userInfo';
    var API_BASE = window.ZhiliApi.apiAuth();

    var form = document.getElementById('profileForm');
    var nicknameInput = document.getElementById('nickname');
    var emailInput = document.getElementById('email');
    var avatarInput = document.getElementById('avatar');
    var avatarFileInput = document.getElementById('avatarFile');
    var avatarUploadZone = document.getElementById('avatarUploadZone');
    var avatarUploadInner = document.getElementById('avatarUploadInner');
    var avatarPreview = document.getElementById('avatarPreview');
    var errorEl = document.getElementById('error-message');
    var successEl = document.getElementById('success-message');
    var btnSubmit = document.getElementById('btnSubmit');
    var newEmailInput = document.getElementById('newEmail');
    var emailCodeInput = document.getElementById('emailCode');
    var btnEmailCode = document.getElementById('btnEmailCode');
    var btnConfirmEmail = document.getElementById('btnConfirmEmail');
    var emailChangeCountdown = null;

    // 未登录则跳转登录页
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        var path = window.location.pathname || '';
        var loginUrl = path.indexOf('pages') >= 0 ? 'login.html' : 'pages/login.html';
        window.location.href = loginUrl;
        return;
    }

    // 从 localStorage 读取并填充
    var userInfoStr = localStorage.getItem(USER_INFO_KEY);
    var userInfo = null;
    try {
        if (userInfoStr) userInfo = JSON.parse(userInfoStr);
    } catch (e) {}
    if (!userInfo) {
        showError('未获取到用户信息，请重新登录');
        return;
    }

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
        if (successEl) successEl.style.display = 'none';
    }

    function showSuccess(msg) {
        if (successEl) {
            successEl.textContent = msg;
            successEl.style.display = 'block';
        }
        if (errorEl) errorEl.style.display = 'none';
    }

    function clearMessages() {
        if (errorEl) errorEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';
    }

    function showSaveSuccessModal() {
        var overlay = document.getElementById('saveSuccessOverlay');
        if (overlay) overlay.classList.add('show');
    }
    function closeSaveSuccessModal() {
        var overlay = document.getElementById('saveSuccessOverlay');
        if (overlay) overlay.classList.remove('show');
    }

    // 生成默认头像（与 auth-header 一致）
    function getDefaultAvatarUrl(nick) {
        var firstChar = nick && nick.length > 0 ? nick.charAt(0) : '';
        var colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'];
        var colorIndex = nick && nick.length > 0 ? nick.charCodeAt(0) % colors.length : 0;
        var color = colors[colorIndex];
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Ccircle cx="24" cy="24" r="24" fill="' + encodeURIComponent(color) + '"/%3E%3Ctext x="24" y="31" text-anchor="middle" fill="white" font-size="22" font-family="Microsoft YaHei, sans-serif" font-weight="500"%3E' + encodeURIComponent(firstChar) + '%3C/text%3E%3C/svg%3E';
    }

    function setAvatarPreview(src) {
        if (!avatarPreview) return;
        if (src && src.trim()) {
            avatarPreview.src = src;
            avatarPreview.onerror = function() { avatarPreview.src = getDefaultAvatarUrl(nicknameInput.value || '用户'); };
        } else {
            avatarPreview.src = getDefaultAvatarUrl(nicknameInput.value || '用户');
        }
    }

    // 初始化表单
    var nick = userInfo.nickname || userInfo.username || userInfo.email || '';
    var email = userInfo.email || '';
    var avatar = (userInfo.avatar && userInfo.avatar.trim()) ? userInfo.avatar : '';
    if (nicknameInput) nicknameInput.value = nick;
    if (emailInput) emailInput.value = email;
    if (avatarInput) avatarInput.value = avatar;
    setAvatarPreview(avatar || getDefaultAvatarUrl(nick));

    // 企业用户且审核通过：显示企业资料区块并回填
    var enterpriseSection = document.getElementById('enterpriseProfileSection');
    var isEnterpriseApproved = (userInfo.userType === 2 && userInfo.enterpriseStatus === 1);

    // 待审核或已拒绝：显示横幅提示
    if (userInfo.userType === 2 && userInfo.enterpriseStatus !== 1) {
        var banner = document.getElementById('profileEntBanner');
        var msgEl = document.getElementById('profileEntMsg');
        if (banner) {
            banner.style.display = 'block';
            if (msgEl) {
                msgEl.textContent = userInfo.enterpriseStatus === 0
                    ? '您的企业账号正在等待管理员审核，审核通过后可在下方填写企业资料。'
                    : '您的企业账号审核未通过，暂无法填写企业资料。如有疑问请联系管理员。';
            }
        }
    }

    if (enterpriseSection && isEnterpriseApproved) {
        enterpriseSection.style.display = 'block';
        var enterpriseNameEl = document.getElementById('enterpriseName');
        var enterpriseAddressEl = document.getElementById('enterpriseAddress');
        var enterprisePhoneEl = document.getElementById('enterprisePhone');
        var enterpriseContactEmailEl = document.getElementById('enterpriseContactEmail');
        var enterpriseWebsiteEl = document.getElementById('enterpriseWebsite');
        var enterpriseIntroductionEl = document.getElementById('enterpriseIntroduction');
        if (enterpriseNameEl) enterpriseNameEl.value = userInfo.enterpriseName || '';
        if (enterpriseAddressEl) enterpriseAddressEl.value = userInfo.enterpriseAddress || '';
        if (enterprisePhoneEl) enterprisePhoneEl.value = userInfo.enterprisePhone || '';
        if (enterpriseContactEmailEl) enterpriseContactEmailEl.value = userInfo.enterpriseContactEmail || userInfo.email || '';
        if (enterpriseWebsiteEl) enterpriseWebsiteEl.value = userInfo.enterpriseWebsite || '';
        if (enterpriseIntroductionEl) enterpriseIntroductionEl.value = userInfo.enterpriseIntroduction || '';
        window._enterpriseTagsList = [];
        if (userInfo.enterpriseTags && typeof userInfo.enterpriseTags === 'string') {
            window._enterpriseTagsList = userInfo.enterpriseTags.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        window._enterpriseCertificationsList = [];
        if (userInfo.enterpriseCertifications && typeof userInfo.enterpriseCertifications === 'string') {
            window._enterpriseCertificationsList = userInfo.enterpriseCertifications.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        renderEnterpriseTags();
        renderEnterpriseCertifications();
    }

    function renderEnterpriseTags() {
        var listEl = document.getElementById('enterpriseTagsList');
        if (!listEl) return;
        var tags = window._enterpriseTagsList || [];
        var colors = ['', 'tag-green', 'tag-orange'];
        listEl.innerHTML = tags.map(function(tag, i) {
            var cls = colors[i % 3];
            return '<span class="tag-chip ' + cls + '">' + escapeHtml(tag) + '<i class="bi bi-x tag-remove" data-tag-index="' + i + '"></i></span>';
        }).join('');
        listEl.querySelectorAll('.tag-remove').forEach(function(el) {
            el.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-tag-index'), 10);
                window._enterpriseTagsList.splice(idx, 1);
                renderEnterpriseTags();
            });
        });
    }
    function escapeHtml(s) {
        if (!s) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function renderEnterpriseCertifications() {
        var listEl = document.getElementById('enterpriseCertificationsList');
        if (!listEl) return;
        var certs = window._enterpriseCertificationsList || [];
        var colors = ['', 'tag-green', 'tag-orange'];
        listEl.innerHTML = certs.map(function(item, i) {
            var cls = colors[i % 3];
            return '<span class="tag-chip ' + cls + '">' + escapeHtml(item) + '<i class="bi bi-x tag-remove" data-cert-index="' + i + '"></i></span>';
        }).join('');
        listEl.querySelectorAll('.tag-remove').forEach(function(el) {
            el.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-cert-index'), 10);
                window._enterpriseCertificationsList.splice(idx, 1);
                renderEnterpriseCertifications();
            });
        });
    }

    if (!window._enterpriseTagsList) window._enterpriseTagsList = [];
    if (!window._enterpriseCertificationsList) window._enterpriseCertificationsList = [];

    if (isEnterpriseApproved) {
        var enterpriseTagInput = document.getElementById('enterpriseTagInput');
        var btnAddTag = document.getElementById('btnAddTag');
        var btnSaveEnterprise = document.getElementById('btnSaveEnterprise');
        function addOneTag() {
            var val = (enterpriseTagInput && enterpriseTagInput.value) ? enterpriseTagInput.value.trim() : '';
            if (!val) return;
            if (window._enterpriseTagsList.indexOf(val) === -1) {
                window._enterpriseTagsList.push(val);
                renderEnterpriseTags();
            }
            if (enterpriseTagInput) enterpriseTagInput.value = '';
        }
        if (btnAddTag) btnAddTag.addEventListener('click', addOneTag);
        if (enterpriseTagInput) {
            enterpriseTagInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); addOneTag(); }
            });
        }
        var enterpriseCertificationInput = document.getElementById('enterpriseCertificationInput');
        var btnAddCertification = document.getElementById('btnAddCertification');
        function addOneCertification() {
            var val = (enterpriseCertificationInput && enterpriseCertificationInput.value) ? enterpriseCertificationInput.value.trim() : '';
            if (!val) return;
            if (window._enterpriseCertificationsList.indexOf(val) === -1) {
                window._enterpriseCertificationsList.push(val);
                renderEnterpriseCertifications();
            }
            if (enterpriseCertificationInput) enterpriseCertificationInput.value = '';
        }
        if (btnAddCertification) btnAddCertification.addEventListener('click', addOneCertification);
        if (enterpriseCertificationInput) {
            enterpriseCertificationInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); addOneCertification(); }
            });
        }
        if (btnSaveEnterprise) {
            btnSaveEnterprise.addEventListener('click', function() {
                clearMessages();
                var address = (document.getElementById('enterpriseAddress') && document.getElementById('enterpriseAddress').value) ? document.getElementById('enterpriseAddress').value.trim() : '';
                var phone = (document.getElementById('enterprisePhone') && document.getElementById('enterprisePhone').value) ? document.getElementById('enterprisePhone').value.trim() : '';
                var contactEmail = (document.getElementById('enterpriseContactEmail') && document.getElementById('enterpriseContactEmail').value) ? document.getElementById('enterpriseContactEmail').value.trim() : '';
                var website = document.getElementById('enterpriseWebsite') ? document.getElementById('enterpriseWebsite').value.trim() : '';
                var introduction = document.getElementById('enterpriseIntroduction') ? document.getElementById('enterpriseIntroduction').value.trim() : '';
                var certificationsStr = (window._enterpriseCertificationsList && window._enterpriseCertificationsList.length) ? window._enterpriseCertificationsList.join(',') : '';
                var tagsStr = (window._enterpriseTagsList && window._enterpriseTagsList.length) ? window._enterpriseTagsList.join(',') : '';
                if (!address) { showError('请填写企业地址'); return; }
                if (!phone) { showError('请填写企业电话'); return; }
                if (!contactEmail) { showError('请填写企业联系邮箱'); return; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) { showError('请填写正确的联系邮箱格式'); return; }
                btnSaveEnterprise.disabled = true;
                btnSaveEnterprise.textContent = '保存中...';
                fetch(API_BASE + '/user/enterprise-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        enterpriseAddress: address,
                        enterprisePhone: phone,
                        enterpriseContactEmail: contactEmail,
                        enterpriseWebsite: website || null,
                        enterpriseIntroduction: introduction || null,
                        enterpriseTags: tagsStr || null,
                        enterpriseCertifications: certificationsStr || null
                    })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    btnSaveEnterprise.disabled = false;
                    btnSaveEnterprise.textContent = '保存企业资料';
                    if (data.code === 200 || data.code === 0) {
                        var fromServer = (data.data && data.data.userInfo) ? data.data.userInfo : (data.data && data.data.user) ? data.data.user : {};
                        var merged = Object.assign({}, userInfo, fromServer);
                        localStorage.setItem(USER_INFO_KEY, JSON.stringify(merged));
                        userInfo = merged;
                        showSuccess('企业资料已保存');
                        showSaveSuccessModal();
                    } else {
                        showError(data.message || '保存失败');
                    }
                })
                .catch(function(err) {
                    console.error(err);
                    btnSaveEnterprise.disabled = false;
                    btnSaveEnterprise.textContent = '保存企业资料';
                    showError('网络错误，请稍后重试');
                });
            });
        }
    }

    nicknameInput.addEventListener('input', function() {
        if (!avatarInput || !avatarInput.value.trim()) setAvatarPreview(getDefaultAvatarUrl(this.value));
    });

    // 选择文件上传 - 使用 OSS 直传
    async function doUpload(file) {
        if (!file || !file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
            showError('请选择 JPG、PNG、GIF 或 WebP 图片');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showError('图片不能超过 2MB');
            return;
        }
        clearMessages();
        if (avatarUploadZone) avatarUploadZone.classList.add('uploading');
        if (avatarUploadInner) avatarUploadInner.innerHTML = '<i class="bi bi-hourglass-split"></i><p>上传中...</p>';

        try {
            // 优先 OSS 直传，失败则经后端上传
            var token = localStorage.getItem('token');
            var url = await window.OssUploader.uploadAvatarWithFallback(file, token);

            if (avatarUploadZone) avatarUploadZone.classList.remove('uploading');
            if (avatarUploadInner) {
                avatarUploadInner.innerHTML = '<i class="bi bi-cloud-arrow-up"></i><p>点击或拖拽照片到此处上传</p><span class="avatar-upload-hint">支持 JPG、PNG、GIF、WebP，不超过 2MB</span>';
            }

            if (avatarInput) avatarInput.value = url;
            setAvatarPreview(url);
            showSuccess('头像上传成功，请点击「保存修改」');
        } catch (err) {
            if (avatarUploadZone) avatarUploadZone.classList.remove('uploading');
            if (avatarUploadInner) {
                avatarUploadInner.innerHTML = '<i class="bi bi-cloud-arrow-up"></i><p>点击或拖拽照片到此处上传</p><span class="avatar-upload-hint">支持 JPG、PNG、GIF、WebP，不超过 2MB</span>';
            }
            console.error(err);
            var msg = err.message || '上传失败';
            if (msg.indexOf('无法连接后端') !== -1) {
                msg = '无法连接后端：请先启动 Java 项目（在 java 目录运行，端口 8080）';
            }
            showError('上传失败: ' + msg);
        }
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', function() {
            var file = this.files && this.files[0];
            if (file) doUpload(file);
            this.value = '';
        });
    }
    if (avatarUploadZone) {
        avatarUploadZone.addEventListener('click', function(e) {
            if (avatarFileInput && !e.target.closest('input')) avatarFileInput.click();
        });
        avatarUploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });
        avatarUploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });
        avatarUploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) doUpload(file);
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        clearMessages();

        var nickname = (nicknameInput && nicknameInput.value) ? nicknameInput.value.trim() : '';
        var avatarUrl = (avatarInput && avatarInput.value) ? avatarInput.value.trim() : '';
        if (!nickname) {
            showError('请输入昵称');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = '保存中...';

        var payload = { nickname: nickname };
        if (avatarUrl) payload.avatar = avatarUrl;

        function applyLocalAndDone(msg) {
            var newUserInfo = Object.assign({}, userInfo, { nickname: nickname, avatar: avatarUrl || userInfo.avatar });
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(newUserInfo));
            if (typeof window.renderAuthHeader === 'function') window.renderAuthHeader();
            showSuccess(msg || '保存成功，头部信息已更新');
            btnSubmit.textContent = '保存修改';
            btnSubmit.disabled = false;
        }

        fetch(API_BASE + '/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        })
        .then(function(res) { return res.json().catch(function() { return {}; }); })
        .then(function(data) {
            if (data.code === 200 || data.code === 0) {
                var fromServer = (data.data && data.data.userInfo) ? data.data.userInfo : (data.data && data.data.user) ? data.data.user : {};
                var merged = Object.assign({}, userInfo, fromServer, { nickname: nickname });
                if (avatarUrl) merged.avatar = avatarUrl;
                localStorage.setItem(USER_INFO_KEY, JSON.stringify(merged));
                if (typeof window.renderAuthHeader === 'function') window.renderAuthHeader();
                showSuccess('保存成功，头部信息已更新');
            } else {
                applyLocalAndDone('已保存到本地（后端接口未就绪时仅更新本地），头部信息已更新');
            }
            btnSubmit.textContent = '保存修改';
            btnSubmit.disabled = false;
        })
        .catch(function(err) {
            console.error('更新失败:', err);
            applyLocalAndDone('已保存到本地，头部信息已更新');
        });
    });

    // ---------- 修改绑定邮箱：发送验证码 ----------
    function startEmailCodeCountdown() {
        if (emailChangeCountdown) clearInterval(emailChangeCountdown);
        var sec = 60;
        if (btnEmailCode) {
            btnEmailCode.disabled = true;
            btnEmailCode.textContent = sec + '秒后重新获取';
        }
        emailChangeCountdown = setInterval(function() {
            sec--;
            if (btnEmailCode) btnEmailCode.textContent = sec + '秒后重新获取';
            if (sec <= 0) {
                clearInterval(emailChangeCountdown);
                emailChangeCountdown = null;
                if (btnEmailCode) {
                    btnEmailCode.disabled = false;
                    btnEmailCode.textContent = '获取验证码';
                }
            }
        }, 1000);
    }

    if (btnEmailCode) {
        btnEmailCode.addEventListener('click', function() {
            var newEmail = newEmailInput && newEmailInput.value ? newEmailInput.value.trim() : '';
            if (!newEmail) {
                showError('请输入新邮箱');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                showError('请输入正确的邮箱格式');
                return;
            }
            if (newEmail.toLowerCase() === (userInfo.email || '').toLowerCase()) {
                showError('新邮箱不能与当前邮箱相同');
                return;
            }
            clearMessages();
            btnEmailCode.disabled = true;
            btnEmailCode.textContent = '发送中...';
            fetch(API_BASE + '/send-email-change-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ newEmail: newEmail })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.code === 200) {
                    showSuccess('验证码已发送到新邮箱，请查收');
                    startEmailCodeCountdown();
                } else {
                    showError(data.message || '发送失败');
                    btnEmailCode.disabled = false;
                    btnEmailCode.textContent = '获取验证码';
                }
            })
            .catch(function(err) {
                console.error(err);
                showError('网络错误，请确认认证服务已启动（端口 8081）');
                btnEmailCode.disabled = false;
                btnEmailCode.textContent = '获取验证码';
            });
        });
    }

    // ---------- 修改绑定邮箱：确认并提交 ----------
    if (btnConfirmEmail) {
        btnConfirmEmail.addEventListener('click', function() {
            var newEmail = newEmailInput && newEmailInput.value ? newEmailInput.value.trim() : '';
            var code = emailCodeInput && emailCodeInput.value ? emailCodeInput.value.trim() : '';
            if (!newEmail) {
                showError('请输入新邮箱');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                showError('请输入正确的邮箱格式');
                return;
            }
            if (!code) {
                showError('请输入验证码');
                return;
            }
            clearMessages();
            btnConfirmEmail.disabled = true;
            btnConfirmEmail.textContent = '提交中...';
            fetch(API_BASE + '/user/email', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ newEmail: newEmail, code: code })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                btnConfirmEmail.disabled = false;
                btnConfirmEmail.textContent = '确认修改邮箱';
                if (data.code === 200 && data.data && data.data.userInfo) {
                    // 保存新 token（邮箱修改后旧 token 已失效）
                    if (data.data.token) {
                        localStorage.setItem(TOKEN_KEY, data.data.token);
                    }
                    userInfo.email = data.data.userInfo.email;
                    localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.data.userInfo));
                    if (emailInput) emailInput.value = data.data.userInfo.email;
                    if (newEmailInput) newEmailInput.value = '';
                    if (emailCodeInput) emailCodeInput.value = '';
                    if (typeof window.renderAuthHeader === 'function') window.renderAuthHeader();
                    showSuccess('绑定邮箱已更新，请使用新邮箱登录');
                } else {
                    showError(data.message || '修改失败');
                }
            })
            .catch(function(err) {
                console.error(err);
                btnConfirmEmail.disabled = false;
                btnConfirmEmail.textContent = '确认修改邮箱';
                showError('网络错误，请稍后重试');
            });
        });
    }

    // 保存成功弹窗：确定按钮与点击遮罩关闭
    var saveSuccessOverlay = document.getElementById('saveSuccessOverlay');
    var btnCloseSaveSuccess = document.getElementById('btnCloseSaveSuccess');
    if (btnCloseSaveSuccess) {
        btnCloseSaveSuccess.addEventListener('click', closeSaveSuccessModal);
    }
    if (saveSuccessOverlay) {
        saveSuccessOverlay.addEventListener('click', function(e) {
            if (e.target === saveSuccessOverlay) closeSaveSuccessModal();
        });
    }
});
