(function () {
    'use strict';
    var API_BASE = window.ZhiliApi.apiRoot();

    function getToken() {
        return localStorage.getItem('token');
    }

    function getUserInfo() {
        var raw = localStorage.getItem('userInfo');
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function checkLogin() {
        var token = getToken();
        if (!token) {
            window.location.href = 'login.html?redirect=my-positions.html';
            return false;
        }
        return true;
    }

    function checkEnterprise() {
        var userInfo = getUserInfo();
        if (!userInfo || userInfo.userType !== 2) {
            window.location.href = 'my-shop.html';
            return false;
        }
        return true;
    }

    function showNotification(message, type) {
        type = type || 'info';
        var notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,0.15);z-index:9999;font-size:14px;transition:opacity 0.3s;';
        var colors = { success: '#4caf50', error: '#f44336', warning: '#ff9800', info: '#2196f3' };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.color = '#fff';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(function () {
            notification.style.opacity = '0';
            setTimeout(function () { notification.remove(); }, 300);
        }, 2500);
    }

    var positionList = [];

    function loadPositions() {
        var userInfo = getUserInfo();
        if (!userInfo || !userInfo.id) {
            document.getElementById('myPositionsContent').innerHTML = '<div class="no-results">请先登录企业账号。<a href="login.html">去登录</a></div>';
            return;
        }
        var container = document.getElementById('myPositionsContent');
        container.innerHTML = '<div class="loading"><i class="bi bi-arrow-repeat"></i><p>加载中...</p></div>';

        fetch(API_BASE + '/jobs/user/' + encodeURIComponent(userInfo.id))
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result && result.code === 200 && Array.isArray(result.data)) {
                    positionList = result.data;
                    renderPositionList(result.data);
                } else {
                    positionList = [];
                    container.innerHTML = '<div class="no-results">暂无已发布岗位，点击「添加岗位」发布第一个岗位吧！</div>';
                }
            })
            .catch(function (err) {
                console.error('加载岗位列表失败:', err);
                container.innerHTML = '<div class="no-results">加载失败，请稍后重试。</div>';
            });
    }

    function formatSalary(job) {
        if (job.salaryMin != null || job.salaryMax != null) {
            var min = job.salaryMin != null ? job.salaryMin + 'K' : '?';
            var max = job.salaryMax != null ? job.salaryMax + 'K' : '?';
            return min + '-' + max + '/月';
        }
        return '面议';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '最近';
        var d = new Date(dateStr);
        return isNaN(d.getTime()) ? '最近' : d.toLocaleDateString('zh-CN');
    }

    function renderPositionList(jobs) {
        var container = document.getElementById('myPositionsContent');
        if (!jobs || jobs.length === 0) {
            container.innerHTML = '<div class="no-results">暂无已发布岗位，点击「添加岗位」发布第一个岗位吧！</div>';
            return;
        }
        var section = document.createElement('div');
        section.className = 'job-list-section';
        section.id = 'job-list-section';
        var html = '';
        jobs.forEach(function (job) {
            var salaryText = formatSalary(job);
            var educationText = job.education || '不限';
            var experienceText = job.experience || '不限';
            var locationText = job.workLocation || '湖州市织里镇';
            var recruitCount = job.recruitCount != null ? job.recruitCount : 1;
            var status = (job.status === 1);
            var statusClass = status ? 'on' : 'off';
            var statusText = status ? '招聘中' : '已下架';
            var publishDate = formatDate(job.publishedAt || job.updatedAt || job.createdAt);
            var desc = (job.jobDescription || '暂无职位描述').substring(0, 80);
            if ((job.jobDescription || '').length > 80) desc += '...';

            html += '<div class="job-card" data-job-id="' + job.id + '">';
            html += '<div class="job-header">';
            html += '<div class="job-title"><h3>' + (job.jobName || '未命名') + '</h3><span class="job-salary">' + salaryText + '</span><span class="position-status ' + statusClass + '">' + statusText + '</span></div>';
            html += '</div>';
            html += '<div class="job-info">';
            html += '<div class="job-tags">';
            html += '<span class="tag"><i class="bi bi-geo-alt"></i> ' + locationText + '</span>';
            html += '<span class="tag"><i class="bi bi-briefcase"></i> ' + experienceText + '</span>';
            html += '<span class="tag"><i class="bi bi-mortarboard"></i> ' + educationText + '</span>';
            html += '<span class="tag"><i class="bi bi-people"></i> ' + recruitCount + '人</span>';
            html += '</div>';
            html += '<div class="job-desc"><p>' + desc + '</p></div>';
            html += '</div>';
            html += '<div class="job-footer">';
            html += '<span class="job-date">发布于 ' + publishDate + '</span>';
            html += '<div class="position-actions">';
            html += '<button type="button" class="btn btn-outline btn-edit-position"><i class="bi bi-pencil"></i> 编辑</button>';
            if (status) {
                html += '<button type="button" class="btn btn-outline btn-toggle-position" data-status="0"><i class="bi bi-box-arrow-down"></i> 下架</button>';
            } else {
                html += '<button type="button" class="btn btn-outline btn-toggle-position" data-status="1"><i class="bi bi-box-arrow-up"></i> 上架</button>';
            }
            html += '</div></div></div>';
        });
        section.innerHTML = html;
        container.innerHTML = '';
        container.appendChild(section);

        section.querySelectorAll('.btn-edit-position').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var card = this.closest('.job-card');
                var id = card && card.getAttribute('data-job-id');
                var job = positionList.find(function (j) { return String(j.id) === String(id); });
                if (job) openPositionModal(job);
            });
        });
        section.querySelectorAll('.btn-toggle-position').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var card = this.closest('.job-card');
                var id = card && card.getAttribute('data-job-id');
                var newStatus = parseInt(this.getAttribute('data-status'), 10);
                var job = positionList.find(function (j) { return String(j.id) === String(id); });
                if (job) updatePositionStatus(job, newStatus);
            });
        });
    }

    function updatePositionStatus(job, newStatus) {
        var body = {
            userId: job.userId,
            jobName: job.jobName,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            workLocation: job.workLocation,
            experience: job.experience,
            education: job.education,
            recruitCount: job.recruitCount,
            jobDescription: job.jobDescription,
            skills: job.skills,
            jobCategory: job.jobCategory,
            status: newStatus
        };
        fetch(API_BASE + '/jobs/' + job.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify(body)
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result && result.code === 200) {
                    showNotification(newStatus === 1 ? '已上架' : '已下架', 'success');
                    loadPositions();
                } else {
                    showNotification(result && result.message ? result.message : '操作失败', 'error');
                }
            })
            .catch(function (err) {
                console.error(err);
                showNotification('网络错误，请稍后重试', 'error');
            });
    }

    var positionModal = document.getElementById('positionFormModal');
    var positionForm = document.getElementById('positionForm');
    var positionFormTitle = document.getElementById('positionFormTitle');

    function openPositionModal(job) {
        if (job) {
            positionFormTitle.textContent = '编辑岗位';
            document.getElementById('positionId').value = job.id;
            document.getElementById('positionJobName').value = job.jobName || '';
            document.getElementById('positionSalaryMin').value = job.salaryMin != null ? job.salaryMin : '';
            document.getElementById('positionSalaryMax').value = job.salaryMax != null ? job.salaryMax : '';
            document.getElementById('positionWorkLocation').value = job.workLocation || '';
            document.getElementById('positionExperience').value = job.experience || '';
            document.getElementById('positionEducation').value = job.education || '';
            document.getElementById('positionRecruitCount').value = job.recruitCount != null ? job.recruitCount : 1;
            document.getElementById('positionJobCategory').value = job.jobCategory || '';
            document.getElementById('positionJobDescription').value = job.jobDescription || '';
            document.getElementById('positionSkills').value = job.skills || '';
        } else {
            positionFormTitle.textContent = '添加岗位';
            document.getElementById('positionId').value = '';
            positionForm.reset();
            document.getElementById('positionRecruitCount').value = 1;
        }
        positionModal.style.display = 'flex';
    }

    function closePositionModal() {
        positionModal.style.display = 'none';
    }

    function submitPositionForm(e) {
        e.preventDefault();
        var idEl = document.getElementById('positionId');
        var id = idEl.value ? idEl.value.trim() : '';
        var jobName = (document.getElementById('positionJobName').value || '').trim();
        if (!jobName) {
            showNotification('请填写职位名称', 'warning');
            return;
        }
        var userInfo = getUserInfo();
        if (!userInfo || !userInfo.id) {
            showNotification('请先登录', 'error');
            return;
        }
        var body = {
            userId: userInfo.id,
            jobName: jobName,
            salaryMin: document.getElementById('positionSalaryMin').value ? parseInt(document.getElementById('positionSalaryMin').value, 10) : null,
            salaryMax: document.getElementById('positionSalaryMax').value ? parseInt(document.getElementById('positionSalaryMax').value, 10) : null,
            workLocation: (document.getElementById('positionWorkLocation').value || '').trim() || null,
            experience: (document.getElementById('positionExperience').value || '').trim() || null,
            education: (document.getElementById('positionEducation').value || '').trim() || null,
            recruitCount: document.getElementById('positionRecruitCount').value ? parseInt(document.getElementById('positionRecruitCount').value, 10) : 1,
            jobDescription: (document.getElementById('positionJobDescription').value || '').trim() || null,
            skills: (document.getElementById('positionSkills').value || '').trim() || null,
            jobCategory: (document.getElementById('positionJobCategory').value || '').trim() || null,
            status: 1
        };
        if (id) body.id = parseInt(id, 10);

        var url = API_BASE + '/jobs';
        var method = 'POST';
        if (id) {
            url = API_BASE + '/jobs/' + id;
            method = 'PUT';
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify(body)
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result && result.code === 200) {
                    showNotification(id ? '修改成功' : '发布成功', 'success');
                    closePositionModal();
                    loadPositions();
                } else {
                    showNotification(result && result.message ? result.message : '保存失败', 'error');
                }
            })
            .catch(function (err) {
                console.error(err);
                showNotification('网络错误，请稍后重试', 'error');
            });
    }

    function initModal() {
        document.getElementById('btnAddPosition').addEventListener('click', function () { openPositionModal(null); });
        document.getElementById('positionFormModalClose').addEventListener('click', closePositionModal);
        document.getElementById('positionFormCancel').addEventListener('click', closePositionModal);
        positionForm.addEventListener('submit', submitPositionForm);
        if (positionModal) {
            positionModal.addEventListener('click', function (e) {
                if (e.target === positionModal) closePositionModal();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (!checkLogin() || !checkEnterprise()) return;
            loadPositions();
            initModal();
        });
    } else {
        if (!checkLogin() || !checkEnterprise()) return;
        loadPositions();
        initModal();
    }
})();
