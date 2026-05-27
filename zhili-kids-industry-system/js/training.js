// 人才培育页面的交互脚本（培训课程从后端 API 加载）
(function() {
    var API_BASE = window.ZhiliApi.apiRoot();
    var TOKEN_KEY = 'token';

    function isLoggedIn() { return !!localStorage.getItem(TOKEN_KEY); }

    function goLogin() {
        var path = window.location.pathname || '';
        var loginUrl = (path.indexOf('pages') >= 0 || path.endsWith('/')) ? 'login.html' : 'pages/login.html';
        window.location.href = loginUrl + '?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }

    // 获取当前筛选条件
    function getCourseFilters() {
        var groups = document.querySelectorAll('#courses .filter-group');
        var category = (groups[0] && groups[0].querySelector('a.active')) ? groups[0].querySelector('a.active').textContent.trim() : '全部';
        var level = (groups[1] && groups[1].querySelector('a.active')) ? groups[1].querySelector('a.active').textContent.trim() : '全部';
        var type = (groups[2] && groups[2].querySelector('a.active')) ? groups[2].querySelector('a.active').textContent.trim() : '全部';
        return { category: category, level: level, type: type };
    }

    // 从 API 加载课程列表
    function loadCourses() {
        var container = document.getElementById('course-list');
        if (!container) return;
        container.innerHTML = '<div class="loading">加载中...</div>';

        var f = getCourseFilters();
        var hasFilters = (f.category && f.category !== '全部') || (f.level && f.level !== '全部') || (f.type && f.type !== '全部');
        var url;
        if (hasFilters) {
            url = API_BASE + '/courses/search';
            var params = [];
            if (f.category && f.category !== '全部') params.push('category=' + encodeURIComponent(f.category));
            if (f.level && f.level !== '全部') params.push('level=' + encodeURIComponent(f.level));
            if (f.type && f.type !== '全部') params.push('type=' + encodeURIComponent(f.type));
            url += '?' + params.join('&');
        } else {
            url = API_BASE + '/courses';
        }

        fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('网络响应失败');
                return response.json();
            })
            .then(function(result) {
                if (result.code === 200 && result.data) {
                    renderCourseCards(result.data);
                    initCoursePagination();
                    bindCourseCardEvents();
                } else {
                    container.innerHTML = '<div class="empty">暂无课程</div>';
                    var pg = document.getElementById('course-pagination');
                    if (pg) pg.innerHTML = '';
                }
            })
            .catch(function(err) {
                console.error('加载课程失败:', err);
                container.innerHTML = '<div class="error">加载失败，请刷新页面重试</div>';
                var pg = document.getElementById('course-pagination');
                if (pg) pg.innerHTML = '';
            });
    }

    // 渲染课程卡片
    function renderCourseCards(courses) {
        var container = document.getElementById('course-list');
        if (!container) return;
        if (!courses || courses.length === 0) {
            container.innerHTML = '<div class="empty">暂无课程</div>';
            return;
        }
        var html = '';
        courses.forEach(function(course) {
            var imgUrl = course.courseImage || '../images/courses/course4.jpg';
            var tagHtml = '';
            if (course.tags) {
                var tagClass = 'course-tag';
                if (course.tags.indexOf('热门') !== -1) tagClass += ' hot';
                else if (course.tags.indexOf('新课') !== -1) tagClass += ' new';
                tagHtml = '<span class="' + tagClass + '">' + course.tags + '</span>';
            }
            var startDate = course.startDate ? String(course.startDate) : '';
            var duration = course.duration != null ? course.duration + '课时' : '-';
            var instructor = course.instructor || '-';
            var level = course.courseLevel || '-';
            var desc = course.courseDescription ? course.courseDescription.substring(0, 50) + (course.courseDescription.length > 50 ? '...' : '') : '';
            var price = course.price != null ? '¥' + Number(course.price).toLocaleString() : '';
            var origPrice = course.originalPrice != null ? '¥' + Number(course.originalPrice).toLocaleString() : '';
            var origPriceHtml = origPrice ? '<span class="original-price">' + origPrice + '</span>' : '';
            var name = course.courseName || '未命名课程';
            var category = course.courseCategory || '';
            var courseType = course.courseType || '';

            html += '<div class="course-card" data-category="' + category + '" data-level="' + level + '" data-type="' + courseType + '" data-course-id="' + (course.id || '') + '" data-course-name="' + (name || '').replace(/"/g, '&quot;') + '">';
            html += '  <div class="course-image">';
            html += '    <img src="' + imgUrl + '" alt="' + name + '">';
            html += '    ' + tagHtml;
            html += '  </div>';
            html += '  <div class="course-content">';
            html += '    <h3>' + name + '</h3>';
            html += '    <div class="course-info">';
            html += '      <span><i class="bi bi-calendar3"></i> 开课时间：' + startDate + '</span>';
            html += '      <span><i class="bi bi-clock"></i> 课程时长：' + duration + '</span>';
            html += '      <span><i class="bi bi-person"></i> 讲师：' + instructor + '</span>';
            html += '      <span><i class="bi bi-bar-chart"></i> 难度：' + level + '</span>';
            html += '    </div>';
            html += '    <p class="course-desc">' + desc + '</p>';
            html += '    <div class="course-footer">';
            html += '      <div class="course-price">';
            html += '        <span class="price">' + price + '</span> ' + origPriceHtml;
            html += '      </div>';
            html += '      <button class="btn-primary btn-enroll">立即报名</button>';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
        });
        container.innerHTML = html;
    }

    // 课程分页
    function initCoursePagination() {
        var courseCards = Array.prototype.slice.call(document.querySelectorAll('#course-list .course-card'));
        var pageSize = 6;
        var paginationContainer = document.getElementById('course-pagination');
        if (!paginationContainer) return;

        if (courseCards.length === 0) {
            paginationContainer.innerHTML = '';
            return;
        }

        courseCards.forEach(function(card, idx) {
            var pageNum = Math.floor(idx / pageSize) + 1;
            card.setAttribute('data-page', pageNum);
            card.style.display = 'none';
        });
        var totalPages = Math.ceil(courseCards.length / pageSize);
        var html = '<a href="#" class="prev disabled" data-page="prev"><i class="bi bi-chevron-left"></i></a>';
        for (var i = 1; i <= totalPages; i++) {
            html += '<a href="#" data-page="' + i + '"' + (i === 1 ? ' class="active"' : '') + '>' + i + '</a>';
        }
        html += '<a href="#" class="next' + (totalPages === 1 ? ' disabled' : '') + '" data-page="next"><i class="bi bi-chevron-right"></i></a>';
        paginationContainer.innerHTML = html;

        var currentPage = 1;
        function showPage(pageNum) {
            courseCards.forEach(function(card) {
                card.style.display = card.getAttribute('data-page') == pageNum ? '' : 'none';
            });
            var links = paginationContainer.querySelectorAll('a');
            links.forEach(function(a) {
                a.classList.remove('active');
                if (a.getAttribute('data-page') == pageNum) a.classList.add('active');
            });
            var prev = paginationContainer.querySelector('.prev');
            var next = paginationContainer.querySelector('.next');
            if (prev) prev.classList.toggle('disabled', pageNum <= 1);
            if (next) next.classList.toggle('disabled', pageNum >= totalPages);
            currentPage = pageNum;
        }
        showPage(1);
        paginationContainer.querySelectorAll('a').forEach(function(a) {
            a.onclick = function(e) {
                e.preventDefault();
                var pageAttr = this.getAttribute('data-page');
                if (pageAttr === 'prev' && currentPage > 1) showPage(currentPage - 1);
                else if (pageAttr === 'next' && currentPage < totalPages) showPage(currentPage + 1);
                else if (!isNaN(parseInt(pageAttr))) showPage(parseInt(pageAttr));
            };
        });
    }

    // 当前选中的课程信息
    var currentCourse = null;

    // 显示确认订单弹窗
    function showOrderModal(course) {
        currentCourse = course;
        var modal = document.getElementById('orderModal');
        if (!modal) return;

        // 填充课程信息
        document.getElementById('orderCourseImage').src = course.courseImage || '../images/courses/course4.jpg';
        document.getElementById('orderCourseImage').alt = course.courseName || '';
        document.getElementById('orderCourseName').textContent = course.courseName || '';
        
        var specText = '';
        if (course.courseCategory) specText += '类别：' + course.courseCategory;
        if (course.courseLevel) specText += (specText ? ' | ' : '') + '级别：' + course.courseLevel;
        if (course.courseType) specText += (specText ? ' | ' : '') + '形式：' + course.courseType;
        document.getElementById('orderCourseSpec').textContent = specText || '默认';

        var price = course.price != null ? Number(course.price) : 0;
        var origPrice = course.originalPrice != null ? Number(course.originalPrice) : price;
        var discount = origPrice - price;
        
        document.getElementById('orderCoursePrice').textContent = '¥' + price.toFixed(2);
        document.getElementById('orderCourseTotal').textContent = '¥' + price.toFixed(2);
        
        // 填充价格汇总
        document.getElementById('summaryCourseAmount').textContent = '¥' + price.toFixed(2);
        document.getElementById('summaryDiscount').textContent = discount > 0 ? '-¥' + discount.toFixed(2) : '-¥0.00';
        document.getElementById('summaryTotalAmount').textContent = '¥' + price.toFixed(2);

        // 填充用户信息（如果有）
        var userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                var user = JSON.parse(userInfo);
                if (user.nickname) document.getElementById('orderReceiverName').value = user.nickname;
                if (user.email) {
                    // email 不填充到手机号，但可以提示用户
                }
            } catch (e) {
                console.error('解析用户信息失败:', e);
            }
        }

        // 显示弹窗
        modal.style.display = 'block';
    }

    // 关闭确认订单弹窗
    function closeOrderModal() {
        var modal = document.getElementById('orderModal');
        if (modal) modal.style.display = 'none';
        currentCourse = null;
    }

    // 确认支付
    function confirmPayment() {
        if (!currentCourse || !currentCourse.id) {
            alert('课程信息有误，请刷新页面后重试');
            return;
        }

        var receiverName = document.getElementById('orderReceiverName').value.trim();
        var receiverPhone = document.getElementById('orderReceiverPhone').value.trim();
        var receiverAddress = document.getElementById('orderReceiverAddress').value.trim();

        if (!receiverName) {
            alert('请输入姓名');
            return;
        }
        if (!receiverPhone) {
            alert('请输入手机号');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(receiverPhone)) {
            alert('请输入正确的手机号');
            return;
        }

        var btn = document.getElementById('btnConfirmPayment');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '支付中...';
        }

        var token = localStorage.getItem(TOKEN_KEY);
        fetch(API_BASE + '/auth/training-orders', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId: currentCourse.id })
        })
            .then(function(res) { return res.json(); })
            .then(function(result) {
                if (result.code === 200) {
                    alert('支付成功！订单已创建');
                    closeOrderModal();
                    // 可选：刷新课程列表以更新报名人数
                    // loadCourses();
                } else {
                    alert(result.message || '支付失败，请稍后重试');
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = '确认支付';
                    }
                }
            })
            .catch(function(err) {
                console.error('支付失败:', err);
                alert('网络错误，请稍后重试');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '确认支付';
                }
            });
    }

    // 报名：先检查登录，未登录跳转登录页；已登录显示确认订单弹窗
    function enrollCourse(courseId, courseName) {
        if (!isLoggedIn()) {
            goLogin();
            return;
        }
        
        // 从课程列表中查找完整的课程信息
        var courseCards = document.querySelectorAll('#course-list .course-card');
        var courseData = null;
        for (var i = 0; i < courseCards.length; i++) {
            var card = courseCards[i];
            var id = parseInt(card.getAttribute('data-course-id'), 10);
            if (id === courseId) {
                // 从卡片中提取课程信息
                var img = card.querySelector('.course-image img');
                var title = card.querySelector('.course-content h3');
                var infoSpans = card.querySelectorAll('.course-info span');
                var priceEl = card.querySelector('.price');
                var origPriceEl = card.querySelector('.original-price');
                
                courseData = {
                    id: courseId,
                    courseName: courseName || (title ? title.textContent.trim() : ''),
                    courseImage: img ? img.src : '',
                    courseCategory: '',
                    courseLevel: '',
                    courseType: '',
                    price: priceEl ? parseFloat(priceEl.textContent.replace(/[¥,]/g, '')) : 0,
                    originalPrice: origPriceEl ? parseFloat(origPriceEl.textContent.replace(/[¥,]/g, '')) : 0
                };
                
                // 尝试从 info spans 中提取信息
                infoSpans.forEach(function(span) {
                    var text = span.textContent || '';
                    if (text.indexOf('难度：') !== -1) {
                        courseData.courseLevel = text.replace('难度：', '').trim();
                    }
                });
                
                // 从 data 属性中获取
                courseData.courseCategory = card.getAttribute('data-category') || '';
                courseData.courseLevel = courseData.courseLevel || card.getAttribute('data-level') || '';
                courseData.courseType = card.getAttribute('data-type') || '';
                
                break;
            }
        }
        
        // 如果找不到，尝试从 API 获取
        if (!courseData) {
            fetch(API_BASE + '/courses')
                .then(function(res) { return res.json(); })
                .then(function(result) {
                    if (result.code === 200 && result.data) {
                        var course = result.data.find(function(c) { return c.id === courseId; });
                        if (course) {
                            showOrderModal(course);
                        } else {
                            alert('课程信息不存在');
                        }
                    } else {
                        alert('获取课程信息失败');
                    }
                })
                .catch(function(err) {
                    console.error('获取课程信息失败:', err);
                    alert('获取课程信息失败，请稍后重试');
                });
        } else {
            showOrderModal(courseData);
        }
    }

    // 绑定课程卡片事件（事件委托）
    function bindCourseCardEvents() {
        var list = document.getElementById('course-list');
        if (!list) return;
        list.addEventListener('mouseenter', function(e) {
            var card = e.target.closest('.course-card');
            if (card) card.style.transform = 'translateY(-10px)';
        }, true);
        list.addEventListener('mouseleave', function(e) {
            var card = e.target.closest('.course-card');
            if (card) card.style.transform = 'translateY(-5px)';
        }, true);
        list.addEventListener('click', function(e) {
            var btn = e.target.closest('.btn-enroll');
            if (!btn) return;
            var card = btn.closest('.course-card');
            if (!card) return;
            e.preventDefault();
            var courseId = parseInt(card.getAttribute('data-course-id'), 10);
            var courseName = card.getAttribute('data-course-name') || '';
            if (!courseId || isNaN(courseId)) {
                alert('课程信息有误，请刷新页面后重试');
                return;
            }
            enrollCourse(courseId, courseName);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        // 标签页切换
        var tabItems = document.querySelectorAll('.training-nav li');
        var tabContents = document.querySelectorAll('.tab-content');
        tabItems.forEach(function(item) {
            item.addEventListener('click', function() {
                tabItems.forEach(function(t) { t.classList.remove('active'); });
                tabContents.forEach(function(c) { c.classList.remove('active'); });
                this.classList.add('active');
                var tabId = this.getAttribute('data-tab');
                if (tabId) {
                    var el = document.getElementById(tabId);
                    if (el) el.classList.add('active');
                }
            });
        });

        // 课程筛选
        document.querySelectorAll('#courses .filter-group a').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var group = this.closest('.filter-group');
                if (group) {
                    group.querySelectorAll('a').forEach(function(a) { a.classList.remove('active'); });
                    this.classList.add('active');
                }
                loadCourses();
            });
        });

        // 首次加载课程
        loadCourses();

        // 确认订单弹窗事件
        var modal = document.getElementById('orderModal');
        var closeBtn = document.getElementById('closeOrderModal');
        var confirmBtn = document.getElementById('btnConfirmPayment');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeOrderModal);
        }
        if (modal) {
            var overlay = modal.querySelector('.order-modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', closeOrderModal);
            }
        }
        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmPayment);
        }

        // 支付方式选择
        var paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(function(method) {
            method.addEventListener('click', function() {
                paymentMethods.forEach(function(m) { m.classList.remove('active'); });
                this.classList.add('active');
                var checkIcons = this.querySelectorAll('.payment-check');
                paymentMethods.forEach(function(m) {
                    var icons = m.querySelectorAll('.payment-check');
                    icons.forEach(function(icon) {
                        if (icon.classList.contains('bi-check-circle-fill')) {
                            icon.classList.remove('bi-check-circle-fill');
                            icon.classList.add('bi-circle');
                        }
                    });
                });
                checkIcons.forEach(function(icon) {
                    icon.classList.remove('bi-circle');
                    icon.classList.add('bi-check-circle-fill');
                });
            });
        });
    });
})();
