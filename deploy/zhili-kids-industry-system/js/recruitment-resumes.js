// 招聘信息页：个人用户查看已投简历，企业用户查看收到的简历
(function () {
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

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        var d = new Date(dateStr);
        return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }

    function statusText(status) {
        if (status === 0) return '待查看';
        if (status === 1) return '已查看';
        if (status === 2) return '通过';
        if (status === 3) return '未通过';
        return '未知';
    }

    function statusClass(status) {
        if (status === 0) return 'pending';
        if (status === 1) return 'viewed';
        if (status === 2) return 'passed';
        if (status === 3) return 'rejected';
        return '';
    }

    function loadResumes() {
        var container = document.getElementById('resumesContent');
        if (!container) return;

        var token = getToken();
        var userInfo = getUserInfo();
        if (!token || !userInfo) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent('recruitment-resumes.html');
            return;
        }

        var isEnterprise = userInfo.userType === 2;
        var endpoint = isEnterprise ? '/auth/job-applications/received' : '/auth/job-applications/mine';

        container.innerHTML = '<div class="loading"><i class="bi bi-arrow-repeat"></i><p>加载中...</p></div>';
        fetch(API_BASE + endpoint, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result.code !== 200 || !result.data) {
                    container.innerHTML = '<div class="no-results">' + (result.message || '加载失败') + '<br><a href="recruitment.html">返回人才招聘</a></div>';
                    return;
                }
                var list = result.data;
                if (!list || list.length === 0) {
                    var emptyMsg = isEnterprise ? '暂无个人用户投递的简历。' : '您还没有投递过简历。';
                    container.innerHTML = '<div class="no-results">' + emptyMsg + '<br><a href="recruitment.html">返回人才招聘</a></div>';
                    return;
                }
                var html = '';
                list.forEach(function (item) {
                    var jobName = (item.jobName || '未知职位').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    var dateStr = formatDate(item.createdAt);
                    var status = item.status != null ? item.status : 0;

                    if (isEnterprise) {
                        // 企业端：展示投递者信息
                        var applicantName = (item.applicantNickname || item.applicantEmail || '匿名').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        var applicantEmail = (item.applicantEmail || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        var resumeUrl = (item.resumeUrl || '').trim();
                        var resumeLinkHtml = resumeUrl
                            ? '<a href="' + resumeUrl.replace(/"/g, '&quot;') + '" class="resume-link" target="_blank" rel="noopener"><i class="bi bi-file-earmark-pdf"></i> 查看简历</a>'
                            : '<span class="resume-link" style="color:#999;">未上传简历</span>';
                        html += '<div class="resume-card">' +
                            '<div><span class="job-name">' + jobName + '</span> <span class="status-badge ' + statusClass(status) + '">' + statusText(status) + '</span></div>' +
                            '<div class="applicant"><i class="bi bi-person"></i> 投递人：' + applicantName + (applicantEmail ? ' <span style="color:#999;">(' + applicantEmail + ')</span>' : '') + '</div>' +
                            '<div class="date"><i class="bi bi-clock"></i> ' + dateStr + '</div>' +
                            '<div>' + resumeLinkHtml + '</div>' +
                            '</div>';
                    } else {
                        // 个人端：展示投递的公司和职位
                        var companyName = (item.companyName || '未知企业').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        html += '<div class="resume-card">' +
                            '<div><span class="job-name">' + jobName + '</span> <span class="status-badge ' + statusClass(status) + '">' + statusText(status) + '</span></div>' +
                            '<div class="applicant"><i class="bi bi-building"></i> ' + companyName + '</div>' +
                            '<div class="date"><i class="bi bi-clock"></i> ' + dateStr + '</div>' +
                            '</div>';
                    }
                });
                container.innerHTML = html;
            })
            .catch(function (err) {
                console.error(err);
                container.innerHTML = '<div class="no-results">网络错误，请稍后重试。<br><a href="recruitment.html">返回人才招聘</a></div>';
            });
    }

    document.addEventListener('DOMContentLoaded', loadResumes);
})();
