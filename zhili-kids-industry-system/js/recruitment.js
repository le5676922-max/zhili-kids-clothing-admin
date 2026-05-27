// 人才招聘页面的交互脚本
document.addEventListener('DOMContentLoaded', function () {
    // 根据用户类型显示不同按钮
    (function initNavButtons() {
        var raw = localStorage.getItem('userInfo');
        var userInfo = null;
        try { if (raw) userInfo = JSON.parse(raw); } catch (e) {}
        var token = localStorage.getItem('token');
        var isLoggedIn = !!token;

        // 「信息」：登录用户可见，有未读时显示红点/数字
        if (isLoggedIn) {
            var btnInfo = document.getElementById('btnJobInfo');
            var unreadDot = document.getElementById('infoUnreadDot');
            if (btnInfo) btnInfo.style.display = '';
            (function loadUnreadCount() {
                var token = localStorage.getItem('token');
                if (!token || !unreadDot) return;
                var API_BASE = window.ZhiliApi.apiRoot();
                fetch(API_BASE + '/auth/chat/unread-count', { headers: { 'Authorization': 'Bearer ' + token } })
                    .then(function (res) { return res.json(); })
                    .then(function (result) {
                        if (result.code === 200 && result.data != null) {
                            if (result.data > 0) {
                                unreadDot.textContent = result.data > 99 ? '99+' : result.data;
                                unreadDot.className = 'info-unread-dot' + (result.data > 9 ? '' : ' small');
                            } else {
                                unreadDot.textContent = '';
                                unreadDot.className = 'info-unread-dot small';
                            }
                            unreadDot.style.display = result.data > 0 ? 'inline-block' : 'none';
                        } else {
                            unreadDot.style.display = 'none';
                        }
                    })
                    .catch(function () { unreadDot.style.display = 'none'; });
            })();
            // 监听 job-info.js 发来的跨页面事件，实时更新红点
            window.addEventListener('chatUnreadUpdated', function (e) {
                if (!unreadDot) return;
                var count = (e && e.detail && e.detail.count) ? e.detail.count : 0;
                if (count > 0) {
                    unreadDot.textContent = count > 99 ? '99+' : count;
                    unreadDot.className = 'info-unread-dot' + (count > 9 ? '' : ' small');
                    unreadDot.style.display = 'inline-block';
                } else {
                    unreadDot.textContent = '';
                    unreadDot.className = 'info-unread-dot small';
                    unreadDot.style.display = 'none';
                }
            });
            // 页面可见时重新拉取，避免标签页长时间在后台漏掉
            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') {
                    loadUnreadCount();
                }
            });
        }
        // 「已投简历」：仅个人用户可见
        if (isLoggedIn && userInfo && userInfo.userType === 1) {
            var btnApps = document.getElementById('btnMyApplications');
            if (btnApps) btnApps.style.display = '';
        }
        // 「添加岗位」「招聘信息」：仅企业用户可见
        if (userInfo && userInfo.userType === 2) {
            var btnPos = document.getElementById('btnAddPosition');
            if (btnPos) btnPos.style.display = '';
            var btnRecruitmentInfo = document.getElementById('btnRecruitmentInfo');
            if (btnRecruitmentInfo) btnRecruitmentInfo.style.display = '';
            // 检查是否有新收到的简历，显示红点
            checkNewApplications(token);
        }
    })();

    function checkNewApplications(token) {
        var apiAuth = window.ZhiliApi ? window.ZhiliApi.apiAuth() : '/api/auth';
        fetch(apiAuth + '/notifications', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function (r) { return r.json(); })
        .then(function (result) {
            if (result.code !== 200 || !result.data) return;
            var hasNew = result.data.some(function (n) {
                return n.type === 'job_application_received' && (n.isRead === 0 || n.isRead === false);
            });
            var dot = document.getElementById('recruitUnreadDot');
            if (dot && hasNew) {
                dot.style.display = 'inline-block';
            }
        })
        .catch(function () {});
    }

    // 初始化加载职位数据
    loadJobPositions();

    // 职位搜索表单提交
    const jobSearchForm = document.getElementById('job-search');
    if (jobSearchForm) {
        jobSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // 获取表单数据
            const keyword = document.getElementById('job-keyword').value;
            const category = document.getElementById('job-category').value;
            const experience = document.getElementById('job-experience').value;
            const education = document.getElementById('job-education').value;
            const salary = document.getElementById('job-salary').value;

            // 输出搜索条件到控制台
            console.log('搜索职位:', {
                keyword,
                category,
                experience,
                education,
                salary
            });

            // 更新筛选标签
            updateFilterTags({
                keyword,
                category,
                experience,
                education,
                salary
            });

            // 重新加载数据（带筛选条件）
            loadJobPositions({ keyword, category, experience, education, salary });
        });
    }

    // 清除全部筛选条件
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // 重置表单
            if (jobSearchForm) {
                jobSearchForm.reset();
            }

            // 清空标签
            const tagList = document.querySelector('.tag-list');
            if (tagList) {
                tagList.innerHTML = '';
            }

            // 重新加载所有数据
            loadJobPositions();
        });
    }

    // 排序选项切换
    const sortOptions = document.querySelectorAll('.sort-options a');
    sortOptions.forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();

            // 移除所有活动状态
            sortOptions.forEach(opt => opt.classList.remove('active'));

            // 添加当前选项的活动状态
            this.classList.add('active');

            // 实际排序逻辑
            var sortType = this.getAttribute('data-sort') || this.textContent.trim();
            if (window._allJobPositions && window._allJobPositions.length > 0) {
                var sorted = window._allJobPositions.slice();
                switch (sortType) {
                    case '最新发布': sorted.sort(function(a, b) { return (b.publishedAt || '').localeCompare(a.publishedAt || ''); }); break;
                    case '薪资最高': sorted.sort(function(a, b) { return (b.salaryMax || 0) - (a.salaryMax || 0); }); break;
                    case '薪资最低': sorted.sort(function(a, b) { return (a.salaryMin || 0) - (b.salaryMin || 0); }); break;
                    default: sorted.sort(function(a, b) { return (b.publishedAt || '').localeCompare(a.publishedAt || ''); }); break;
                }
                window._allJobPositions = sorted;
                renderJobCards(sorted);
            }
        });
    });

    // 更新筛选标签
    function updateFilterTags(filters) {
        const tagList = document.querySelector('.tag-list');
        if (!tagList) return;

        // 清空现有标签
        tagList.innerHTML = '';

        // 添加新标签
        const categoryLabels = {
            'design': '设计类',
            'production': '生产类',
            'marketing': '营销类',
            'management': '管理类',
            'technical': '技术类'
        };

        const experienceLabels = {
            '应届毕业生': '应届毕业生',
            '1-3年': '1-3年',
            '3-5年': '3-5年',
            '5-10年': '5-10年',
            '10年以上': '10年以上'
        };

        const educationLabels = {
            '高中及以下': '高中及以下',
            '大专': '大专',
            '本科': '本科',
            '硕士': '硕士',
            '博士': '博士'
        };

        const salaryLabels = {
            '0-5k': '5K以下',
            '5-10k': '5K-10K',
            '10-15k': '10K-15K',
            '15-20k': '15K-20K',
            '20k+': '20K以上'
        };

        if (filters.keyword) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `关键词: ${filters.keyword} <i class="bi bi-x"></i>`;
            tag.querySelector('i').addEventListener('click', function () {
                document.getElementById('job-keyword').value = '';
                tag.remove();
            });
            tagList.appendChild(tag);
        }

        if (filters.category) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `职位类别: ${categoryLabels[filters.category]} <i class="bi bi-x"></i>`;
            tag.querySelector('i').addEventListener('click', function () {
                document.getElementById('job-category').value = '';
                tag.remove();
            });
            tagList.appendChild(tag);
        }

        if (filters.experience) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `工作经验: ${experienceLabels[filters.experience]} <i class="bi bi-x"></i>`;
            tag.querySelector('i').addEventListener('click', function () {
                document.getElementById('job-experience').value = '';
                tag.remove();
            });
            tagList.appendChild(tag);
        }

        if (filters.education) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `学历要求: ${educationLabels[filters.education]} <i class="bi bi-x"></i>`;
            tag.querySelector('i').addEventListener('click', function () {
                document.getElementById('job-education').value = '';
                tag.remove();
            });
            tagList.appendChild(tag);
        }

        if (filters.salary) {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `薪资范围: ${salaryLabels[filters.salary]} <i class="bi bi-x"></i>`;
            tag.querySelector('i').addEventListener('click', function () {
                document.getElementById('job-salary').value = '';
                tag.remove();
            });
            tagList.appendChild(tag);
        }
    }

    // 从API加载职位数据
    function loadJobPositions(filters = {}) {
        const jobListSection = document.getElementById('job-list-section');
        if (!jobListSection) return;

        // 显示加载中
        jobListSection.innerHTML = '<div class="loading">加载中...</div>';

        var API_BASE = window.ZhiliApi.apiRoot();

        // 判断是否有筛选条件，使用不同的API
        let url;
        const hasFilters = filters.keyword || filters.category || filters.experience || filters.education || filters.salary;

        if (hasFilters) {
            // 有筛选条件，使用搜索API
            url = API_BASE + '/jobs/search';
            const params = new URLSearchParams();

            if (filters.keyword) {
                params.append('keyword', filters.keyword);
            }
            if (filters.category) {
                params.append('category', filters.category);
            }
            if (filters.experience) {
                params.append('experience', filters.experience);
            }
            if (filters.education) {
                params.append('education', filters.education);
            }
            if (filters.salary) {
                params.append('salary', filters.salary);
            }

            url += '?' + params.toString();
        } else {
            // 无筛选条件，获取所有职位
            url = API_BASE + '/jobs';
        }

        var token = localStorage.getItem('token') || sessionStorage.getItem('token');
        var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        fetch(url, { headers: headers })
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                return response.json();
            })
            .then(result => {
                if (result.code === 200 && Array.isArray(result.data)) {
                    window._allJobPositions = result.data; // 保存供排序使用
                    renderJobCards(result.data);
                } else {
                    jobListSection.innerHTML = '<div class="empty">暂无招聘信息</div>';
                }
            })
            .catch(error => {
                console.error('加载职位数据失败:', error);
                jobListSection.innerHTML = '<div class="error">加载失败，请刷新页面重试</div>';
            });
    }

    // 渲染职位卡片
    function renderJobCards(jobs) {
        const jobListSection = document.getElementById('job-list-section');
        if (!jobListSection) return;

        if (!jobs || jobs.length === 0) {
            jobListSection.innerHTML = '<div class="empty">暂无招聘信息</div>';
            return;
        }

        let html = '';

        jobs.forEach(job => {
            // 处理薪资显示
            const salaryText = `${job.salaryMin}K-${job.salaryMax}K`;

            // 处理技能标签
            let skillsHtml = '';
            if (job.skills) {
                const skills = job.skills.split(',');
                skills.forEach(skill => {
                    skillsHtml += `<span class="skill">${skill.trim()}</span>`;
                });
            }

            // 处理公司logo
            let logoUrl = '../images/company/default-logo.png';
            if (job.companyLogo) {
                // 如果logo是完整URL（OSS或其他外部链接）
                if (job.companyLogo.startsWith('http://') || job.companyLogo.startsWith('https://')) {
                    logoUrl = job.companyLogo;
                } else if (job.companyLogo.startsWith('/')) {
                    // 如果是相对路径（与当前后端同源）
                    logoUrl = window.ZhiliApi.backendOrigin() + job.companyLogo;
                } else {
                    logoUrl = job.companyLogo;
                }
            }

            // 处理公司名称
            const companyName = job.companyName || '企业用户';

            // 处理发布日期
            let publishDate = '最近';
            if (job.publishedAt) {
                const date = new Date(job.publishedAt);
                publishDate = date.toLocaleDateString('zh-CN');
            }

            // 处理学历和经验
            const educationText = job.education || '不限';
            const experienceText = job.experience || '不限';

            const entId = job.userId != null ? String(job.userId) : '';
            const jobNameEsc = String(job.jobName || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

            html += `
                <div class="job-card" data-job-id="${job.id}">
                    <div class="job-header">
                        <div class="job-title">
                            <h3>${job.jobName}</h3>
                            <span class="job-salary">${salaryText}</span>
                        </div>
                        <div class="job-company">
                            <img src="${logoUrl}" alt="${companyName}" onerror="this.src='../images/company/default-logo.png'">
                            <span>${companyName}</span>
                        </div>
                    </div>
                    <div class="job-info">
                        <div class="job-tags">
                            <span class="tag"><i class="bi bi-geo-alt"></i> ${job.workLocation || '湖州市织里镇'}</span>
                            <span class="tag"><i class="bi bi-briefcase"></i> ${experienceText}</span>
                            <span class="tag"><i class="bi bi-mortarboard"></i> ${educationText}</span>
                            <span class="tag"><i class="bi bi-people"></i> ${job.recruitCount || 1}人</span>
                        </div>
                        <div class="job-desc">
                            <p>${job.jobDescription || '暂无职位描述'}</p>
                        </div>
                        <div class="job-skills">
                            ${skillsHtml}
                        </div>
                    </div>
                    <div class="job-footer">
                        <span class="job-date">发布于 ${publishDate}</span>
                        <div class="job-actions">
                            <button type="button" class="btn-outline btn-communicate" data-enterprise-id="${entId}" data-job-id="${job.id}" data-job-name="${jobNameEsc}"><i class="bi bi-chat-dots"></i> 沟通</button>
                            <button type="button" class="btn-outline btn-favorite"><i class="bi bi-star"></i> 收藏</button>
                            <button type="button" class="btn-primary btn-apply"><i class="bi bi-send"></i> 立即申请</button>
                        </div>
                    </div>
                </div>
            `;
        });

        jobListSection.innerHTML = html;

        // 添加职位卡片交互效果
        initJobCardInteractions();
    }

    // 职位卡片交互效果
    function initJobCardInteractions() {
        const jobCards = document.querySelectorAll('.job-card');

        jobCards.forEach(card => {
            // 沟通：先创建 Redis 临时会话（职位 job），再进入 job-info 与企业即时聊天
            const communicateBtn = card.querySelector('.btn-communicate');
            if (communicateBtn) {
                communicateBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    const token = localStorage.getItem('token');
                    if (!token) {
                        window.location.href = 'login.html?redirect=' + encodeURIComponent('recruitment.html');
                        return;
                    }
                    var userInfo = null;
                    try {
                        var raw = localStorage.getItem('userInfo');
                        if (raw) userInfo = JSON.parse(raw);
                    } catch (err) {}
                    const enterpriseId = communicateBtn.getAttribute('data-enterprise-id') || '';
                    const jobId = communicateBtn.getAttribute('data-job-id') || '';
                    const jobName = communicateBtn.getAttribute('data-job-name') || '';
                    if (userInfo && userInfo.userType === 2 && String(userInfo.id) === enterpriseId) {
                        alert('不能与自己沟通');
                        return;
                    }
                    if (!enterpriseId || !jobId) {
                        alert('职位信息不完整，无法发起沟通');
                        return;
                    }
                    const API_AUTH = window.ZhiliApi.apiAuth();
                    const origHtml = communicateBtn.innerHTML;
                    communicateBtn.disabled = true;
                    communicateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 连接中...';
                    fetch(API_AUTH + '/temp-chat/sessions', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            otherUserId: enterpriseId,
                            productId: String(jobId),
                            productType: 'job',
                            productTitle: jobName || '职位沟通'
                        })
                    })
                        .then(function (res) { return res.json(); })
                        .then(function (result) {
                            var url = 'job-info.html?enterpriseId=' + encodeURIComponent(enterpriseId) +
                                '&jobId=' + encodeURIComponent(jobId) +
                                '&jobName=' + encodeURIComponent(jobName);
                            if (result && result.code === 200 && result.data && result.data.sessionId) {
                                url += '&tempSessionId=' + encodeURIComponent(result.data.sessionId);
                            } else if (result && result.code !== 200 && result.message) {
                                console.warn('临时会话:', result.message);
                            }
                            window.location.href = url;
                        })
                        .catch(function (err) {
                            console.warn(err);
                            window.location.href = 'job-info.html?enterpriseId=' + encodeURIComponent(enterpriseId) +
                                '&jobId=' + encodeURIComponent(jobId) +
                                '&jobName=' + encodeURIComponent(jobName);
                        })
                        .finally(function () {
                            communicateBtn.disabled = false;
                            communicateBtn.innerHTML = origHtml;
                        });
                });
            }
            // 添加收藏功能（localStorage持久化）
            const collectBtn = card.querySelector('.btn-favorite');
            if (collectBtn) {
                var cardJobId = card.getAttribute('data-job-id') || '';
                // 初始化收藏状态
                var favKey = 'job_fav_' + cardJobId;
                var isFav = localStorage.getItem(favKey) === '1';
                if (isFav) {
                    collectBtn.innerHTML = '<i class="bi bi-star-fill"></i> 已收藏';
                }
                collectBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    var favKey = 'job_fav_' + cardJobId;
                    var isFav = localStorage.getItem(favKey) === '1';
                    if (!isFav) {
                        localStorage.setItem(favKey, '1');
                        this.innerHTML = '<i class="bi bi-star-fill"></i> 已收藏';
                    } else {
                        localStorage.removeItem(favKey);
                        this.innerHTML = '<i class="bi bi-star"></i> 收藏';
                    }
                });
            }

            // 添加申请功能：打开申请弹窗
            const applyBtn = card.querySelector('.btn-apply');
            if (applyBtn) {
                applyBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    const token = localStorage.getItem('token');
                    if (!token) {
                        window.location.href = 'login.html?redirect=' + encodeURIComponent('recruitment.html');
                        return;
                    }
                    const jobId = card.getAttribute('data-job-id');
                    const jobNameEl = card.querySelector('.job-title h3');
                    const jobName = jobNameEl ? jobNameEl.textContent : '该职位';
                    openApplyModal(jobId, jobName);
                });
            }
        });
    }

    // ---------- 申请职位弹窗 ----------
    const applyModal = document.getElementById('applyJobModal');
    const applyJobIdEl = document.getElementById('applyJobId');
    const applyJobNameEl = document.getElementById('applyJobName');
    const applyResumeFileEl = document.getElementById('applyResumeFile');
    const resumePreviewEl = document.getElementById('resumePreview');
    const applyJobFormEl = document.getElementById('applyJobForm');

    function openApplyModal(jobId, jobName) {
        if (applyJobIdEl) applyJobIdEl.value = jobId || '';
        if (applyJobNameEl) applyJobNameEl.textContent = '申请职位：' + (jobName || '');
        if (applyResumeFileEl) {
            applyResumeFileEl.value = '';
        }
        if (resumePreviewEl) resumePreviewEl.innerHTML = '';
        if (applyModal) applyModal.style.display = 'flex';
    }

    function closeApplyModal() {
        if (applyModal) applyModal.style.display = 'none';
    }

    if (applyResumeFileEl) {
        applyResumeFileEl.addEventListener('change', function () {
            const file = this.files && this.files[0];
            if (!resumePreviewEl) return;
            resumePreviewEl.innerHTML = '';
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = '简历预览';
                resumePreviewEl.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    if (document.getElementById('applyModalClose')) {
        document.getElementById('applyModalClose').addEventListener('click', closeApplyModal);
    }
    if (document.getElementById('applyModalCancel')) {
        document.getElementById('applyModalCancel').addEventListener('click', closeApplyModal);
    }
    if (applyModal) {
        applyModal.addEventListener('click', function (e) {
            if (e.target === applyModal) closeApplyModal();
        });
    }

    if (applyJobFormEl) {
        applyJobFormEl.addEventListener('submit', function (e) {
            e.preventDefault();
            const jobId = applyJobIdEl && applyJobIdEl.value ? applyJobIdEl.value.trim() : '';
            const file = applyResumeFileEl && applyResumeFileEl.files && applyResumeFileEl.files[0];
            if (!jobId) {
                alert('请选择职位');
                return;
            }
            if (!file || !file.type.startsWith('image/')) {
                alert('请上传简历图片（支持 JPG、PNG、GIF、WebP）');
                return;
            }
            const token = localStorage.getItem('token');
            const submitBtn = document.getElementById('applyModalSubmit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '上传中...';
            }
            const formData = new FormData();
            formData.append('file', file);
            fetch(window.ZhiliApi.apiUpload() + '/resume', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            })
                .then(function (res) { return res.json(); })
                .then(function (result) {
                    if (result && result.code === 200 && result.data && result.data.url) {
                        return fetch(window.ZhiliApi.apiAuth() + '/job-applications', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ jobId: parseInt(jobId, 10), resumeUrl: result.data.url })
                        }).then(function (r) { return r.json(); });
                    }
                    return Promise.reject(new Error(result && result.message ? result.message : '简历上传失败'));
                })
                .then(function (result) {
                    if (result && result.code === 200) {
                        closeApplyModal();
                        alert('投递成功！简历已上传至平台。');
                    } else {
                        alert(result && result.message ? result.message : '投递失败');
                    }
                })
                .catch(function (err) {
                    console.error(err);
                    alert(err.message || '网络错误，请稍后重试');
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="bi bi-send"></i> 完成';
                    }
                });
        });
    }
});
