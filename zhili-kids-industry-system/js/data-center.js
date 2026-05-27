document.addEventListener('DOMContentLoaded', function() {
    // 从API加载数据中心数据（内联实现，避免作用域嵌套问题）
    (function fetchData() {
        fetch('/api/data-center/all')
            .then(function(res) { return res.json(); })
            .then(function(result) {
                if (result.code === 200 && result.data) {
                    var overview = result.data.industryOverview;
                    if (overview) {
                        var kpiNumbers = document.querySelectorAll('.kpi-number');
                        if (kpiNumbers.length >= 4) {
                            kpiNumbers[0].textContent = overview.registeredCompanies || kpiNumbers[0].textContent;
                            kpiNumbers[1].textContent = overview.totalOutput || kpiNumbers[1].textContent;
                            kpiNumbers[2].textContent = overview.annualProduction || kpiNumbers[2].textContent;
                            kpiNumbers[3].textContent = overview.employees || kpiNumbers[3].textContent;
                        }
                    }
                }
            })
            .catch(function() { console.log('数据中心API暂不可用，使用静态数据'); });
    })();

    // 获取所有导航标签和内容区域
    const navItems = document.querySelectorAll('.data-nav li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 标签切换函数
    function switchTab(tabId) {
        // 移除所有活动标签和内容
        navItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // 激活选中的标签和内容
        const selectedNav = document.querySelector(`.data-nav li[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(tabId);
        
        if (selectedNav && selectedContent) {
            selectedNav.classList.add('active');
            selectedContent.classList.add('active');

            // 更新URL哈希值
            history.replaceState(null, null, `#${tabId}`);

            // 滚动到选中的内容区域
            selectedNav.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // 添加内容切换动画
            selectedContent.style.opacity = '0';
            selectedContent.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                selectedContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                selectedContent.style.opacity = '1';
                selectedContent.style.transform = 'translateY(0)';
                
                // 触发数字动画
                animateNumbers();
                
                // 触发图表加载动画
                animateCharts();
            }, 50);
        }
    }
    
    // 为导航标签添加点击事件
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 添加点击波纹效果
            const ripple = document.createElement('span');
            ripple.classList.add('nav-ripple');
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 1000);
            
            switchTab(tabId);
        });
    });
    
    // 检查URL哈希值，激活对应标签
    function checkHash() {
        let hash = window.location.hash;
        if (hash) {
            // 移除哈希符号
            hash = hash.substring(1);
            
            // 检查是否有对应的标签页
            const targetTab = document.getElementById(hash);
            if (targetTab) {
                switchTab(hash);
                
                // 平滑滚动到标签位置
                setTimeout(() => {
                    targetTab.scrollIntoView({behavior: 'smooth'});
                }, 100);
            }
        } else {
            // 默认显示第一个标签页，并添加动画
            switchTab(navItems[0].getAttribute('data-tab'));
        }
    }
    
    // 初始检查哈希值
    checkHash();
    
    // 监听哈希值变化
    window.addEventListener('hashchange', checkHash);
    
    // 添加KPI卡片3D翻转效果
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
        // 添加3D效果所需的类
        card.classList.add('kpi-card-3d');
        
        // 鼠标移动时的3D效果
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // 鼠标在卡片上的X坐标
            const y = e.clientY - rect.top;  // 鼠标在卡片上的Y坐标
            
            // 计算旋转角度，最大±15度
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateY = ((x - centerX) / centerX) * 10; // X轴位置影响Y轴旋转
            const rotateX = ((centerY - y) / centerY) * 10; // Y轴位置影响X轴旋转
            
            // 应用3D变换
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            
            // 动态光影效果
            const shine = this.querySelector('.card-shine') || document.createElement('div');
            if (!this.querySelector('.card-shine')) {
                shine.classList.add('card-shine');
                this.appendChild(shine);
            }
            
            // 根据鼠标位置更新光影效果
            const shineX = (x / rect.width) * 100;
            const shineY = (y / rect.height) * 100;
            shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`;
        });
        
        // 鼠标离开时恢复
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            const shine = this.querySelector('.card-shine');
            if (shine) shine.style.background = 'none';
        });
    });
    
    // 数字滚动动画
    function animateNumbers() {
        const numberElements = document.querySelectorAll('.kpi-number');
        
        numberElements.forEach(element => {
            // 如果已经动画过，则不再重复
            if (element.dataset.animated === 'true') return;
            
            const finalValue = element.textContent;
            let numericValue;
            let suffix = '';
            
            // 提取数字和单位
            if (finalValue.includes('亿')) {
                numericValue = parseFloat(finalValue.replace('亿', ''));
                suffix = '亿';
            } else if (finalValue.includes('万')) {
                numericValue = parseFloat(finalValue.replace('万', ''));
                suffix = '万';
            } else if (finalValue.includes('件')) {
                numericValue = parseFloat(finalValue.replace('件', ''));
                suffix = '件';
            } else {
                numericValue = parseFloat(finalValue);
            }
            
            // 如果不是数字，跳过
            if (isNaN(numericValue)) return;
            
            // 设置初始值为0
            let startValue = 0;
            element.textContent = startValue + suffix;
            
            // 动画持续时间
            const duration = 2000; // 2秒
            const frameDuration = 1000 / 60; // 60fps
            const totalFrames = Math.round(duration / frameDuration);
            
            // 使用requestAnimationFrame实现平滑动画
            let frame = 0;
            function animate() {
                frame++;
                // 使用缓动函数使动画更自然
                const progress = frame / totalFrames;
                const easedProgress = easeOutExpo(progress);
                const currentValue = startValue + easedProgress * (numericValue - startValue);
                
                // 有后缀（亿/万/件）按数值大小显示小数，无后缀（纯数字如企业数）不显示小数
                const decimals = suffix ? (numericValue > 100 ? 1 : 2) : 0;
                element.textContent = currentValue.toFixed(decimals) + suffix;
                
                if (frame < totalFrames) {
                    requestAnimationFrame(animate);
                } else {
                    // 确保最终显示的是精确值
                    element.textContent = finalValue;
                    element.dataset.animated = 'true';
                    
                    // 添加完成后的高亮效果
                    element.style.textShadow = '0 0 10px rgba(66, 153, 225, 0.8)';
                    setTimeout(() => {
                        element.style.textShadow = 'none';
                    }, 500);
                }
            }
            
            requestAnimationFrame(animate);
        });
    }
    
    // 缓动函数
    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    
    // 图表加载动画
    function animateCharts() {
        const chartImages = document.querySelectorAll('.chart-placeholder img');
        
        chartImages.forEach((img, index) => {
            // 如果已经动画过，则不再重复
            if (img.dataset.animated === 'true') return;
            
            // 设置初始状态
            img.style.opacity = '0';
            img.style.transform = 'scale(0.8)';
            
            // 延迟加载，错开动画
            setTimeout(() => {
                img.style.transition = 'opacity 1s ease, transform 1s ease';
                img.style.opacity = '1';
                img.style.transform = 'scale(1)';
                img.dataset.animated = 'true';
                
                // 添加闪光扫过效果
                const shine = document.createElement('div');
                shine.classList.add('chart-shine');
                img.parentNode.appendChild(shine);
                
                setTimeout(() => {
                    shine.style.left = '100%';
                    
                    setTimeout(() => {
                        shine.remove();
                    }, 600);
                }, 100);
            }, index * 200); // 错开每个图表的动画时间
        });
    }
    
    // 表格排序功能
    function initTableSort() {
        const tables = document.querySelectorAll('.data-table');
        
        tables.forEach(table => {
            const headers = table.querySelectorAll('thead th');
            
            headers.forEach((header, index) => {
                // 添加排序图标和样式
                header.style.position = 'relative';
                header.style.cursor = 'pointer';
                const sortIcon = document.createElement('span');
                sortIcon.innerHTML = '⇅';
                sortIcon.style.position = 'absolute';
                sortIcon.style.right = '5px';
                sortIcon.style.opacity = '0.5';
                header.appendChild(sortIcon);
                
                // 添加排序点击事件
                header.addEventListener('click', function() {
                    const isAscending = this.getAttribute('data-sort') !== 'asc';
                    
                    // 重置所有表头排序状态
                    headers.forEach(h => {
                        h.removeAttribute('data-sort');
                        h.querySelector('span').innerHTML = '⇅';
                        h.querySelector('span').style.opacity = '0.5';
                    });
                    
                    // 设置当前表头排序状态
                    this.setAttribute('data-sort', isAscending ? 'asc' : 'desc');
                    this.querySelector('span').innerHTML = isAscending ? '↑' : '↓';
                    this.querySelector('span').style.opacity = '1';
                    
                    // 执行排序
                    sortTable(table, index, isAscending);
                });
            });
        });
    }
    
    // 表格排序逻辑
    function sortTable(table, columnIndex, ascending) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // 排序行
        rows.sort((a, b) => {
            const cellA = a.cells[columnIndex].textContent.trim();
            const cellB = b.cells[columnIndex].textContent.trim();
            
            // 判断是否为数字
            const isNumber = !isNaN(parseFloat(cellA)) && !isNaN(parseFloat(cellB));
            
            if (isNumber) {
                return ascending ? 
                    parseFloat(cellA) - parseFloat(cellB) : 
                    parseFloat(cellB) - parseFloat(cellA);
            } else {
                return ascending ? 
                    cellA.localeCompare(cellB) : 
                    cellB.localeCompare(cellA);
            }
        });
        
        // 重新添加排序后的行
        rows.forEach(row => tbody.appendChild(row));
        
        // 添加排序后的行高亮效果
        rows.forEach((row, index) => {
            row.style.backgroundColor = '';
            setTimeout(() => {
                row.style.backgroundColor = 'rgba(66, 153, 225, 0.1)';
                setTimeout(() => {
                    row.style.backgroundColor = '';
                    row.style.transition = 'background-color 0.5s ease';
                }, 300);
            }, index * 50);
        });
    }
    
    // 添加表格过滤功能
    function initTableFilter() {
        const tables = document.querySelectorAll('.data-table');
        
        tables.forEach(table => {
            // 创建过滤输入框
            const filterContainer = document.createElement('div');
            filterContainer.className = 'table-filter';
            filterContainer.style.margin = '0 0 15px 0';
            filterContainer.style.display = 'flex';
            filterContainer.style.alignItems = 'center';
            
            const filterLabel = document.createElement('label');
            filterLabel.textContent = '搜索: ';
            filterLabel.style.marginRight = '10px';
            
            const filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.placeholder = '输入关键词过滤...';
            filterInput.style.padding = '8px';
            filterInput.style.borderRadius = '4px';
            filterInput.style.border = '1px solid #e2e8f0';
            filterInput.style.width = '250px';
            
            filterContainer.appendChild(filterLabel);
            filterContainer.appendChild(filterInput);
            
            // 将过滤器添加到表格前
            table.parentNode.insertBefore(filterContainer, table);
            
            // 添加过滤事件
            filterInput.addEventListener('input', function() {
                const filterValue = this.value.toLowerCase();
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    let matchFound = false;
                    const cells = row.querySelectorAll('td');
                    
                    cells.forEach(cell => {
                        if (cell.textContent.toLowerCase().includes(filterValue)) {
                            matchFound = true;
                        }
                    });
                    
                    // 添加淡入淡出效果
                    if (matchFound) {
                        row.style.display = '';
                        row.style.opacity = '0';
                        setTimeout(() => {
                            row.style.transition = 'opacity 0.3s ease';
                            row.style.opacity = '1';
                        }, 10);
                    } else {
                        row.style.opacity = '0';
                        setTimeout(() => {
                            row.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
    
    // 图表悬停效果增强
    function addChartHoverEffects() {
        const chartWrappers = document.querySelectorAll('.chart-wrapper');
        
        chartWrappers.forEach(wrapper => {
            // 添加3D效果
            wrapper.classList.add('chart-3d-effect');
            
            wrapper.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) rotateX(5deg)';
                this.style.boxShadow = '0 20px 30px rgba(0,0,0,0.15)';
                
                // 添加发光边框
                this.style.border = '1px solid rgba(66, 153, 225, 0.5)';
                this.style.boxShadow = '0 10px 30px rgba(66, 153, 225, 0.2), 0 0 10px rgba(66, 153, 225, 0.1)';
            });
            
            wrapper.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
                this.style.border = '';
            });
        });
    }
    
    // 创建粒子背景
    function createParticleBackground() {
        const container = document.querySelector('main.container');
        if (!container) return;
        
        // 创建粒子容器
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-background';
        particleContainer.style.position = 'absolute';
        particleContainer.style.top = '0';
        particleContainer.style.left = '0';
        particleContainer.style.width = '100%';
        particleContainer.style.height = '100%';
        particleContainer.style.zIndex = '-1';
        particleContainer.style.overflow = 'hidden';
        particleContainer.style.pointerEvents = 'none';
        
        // 将粒子容器添加到主容器
        container.style.position = 'relative';
        container.insertBefore(particleContainer, container.firstChild);
        
        // 创建粒子
        const particleCount = 50; // 粒子数量
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // 随机样式
            const size = Math.random() * 5 + 2;
            const opacity = Math.random() * 0.5 + 0.1;
            
            particle.style.position = 'absolute';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = `rgba(66, 153, 225, ${opacity})`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.transition = 'transform 0.5s ease';
            
            // 添加动画
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            
            particle.style.animation = `float ${duration}s ${delay}s infinite ease-in-out`;
            
            particleContainer.appendChild(particle);
            
            // 鼠标移动时粒子跟随效果
            document.addEventListener('mousemove', function(e) {
                const mouseX = e.clientX / window.innerWidth;
                const mouseY = e.clientY / window.innerHeight;
                
                // 计算粒子应该移动的距离
                const moveX = (mouseX - 0.5) * 20; // 最大移动10px
                const moveY = (mouseY - 0.5) * 20;
                
                // 每个粒子的移动量不同，创造深度效果
                const depthFactor = size / 7; // 越大的粒子移动越多
                
                particle.style.transform = `translate(${moveX * depthFactor}px, ${moveY * depthFactor}px)`;
            });
        }
        
        // 添加关键帧动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% {
                    transform: translate(0, 0);
                }
                25% {
                    transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
                }
                50% {
                    transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
                }
                75% {
                    transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
                }
            }
            
            .nav-ripple {
                position: absolute;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 1s linear;
                pointer-events: none;
            }
            
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .kpi-card-3d {
                transition: transform 0.5s ease, box-shadow 0.5s ease;
                transform-style: preserve-3d;
            }
            
            .card-shine {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 10;
            }
            
            .chart-3d-effect {
                transition: transform 0.5s ease, box-shadow 0.5s ease, border 0.5s ease;
                transform-style: preserve-3d;
            }
            
            .chart-shine {
                position: absolute;
                top: 0;
                left: -100%;
                width: 50%;
                height: 100%;
                background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
                transform: skewX(-25deg);
                transition: left 0.6s ease;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 添加数据趋势动画
    function animateTrendData() {
        const trendYears = document.querySelectorAll('.trend-year');
        
        trendYears.forEach((year, index) => {
            // 设置初始状态
            year.style.opacity = '0';
            year.style.transform = 'translateY(20px)';
            
            // 延迟加载，错开动画
            setTimeout(() => {
                year.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                year.style.opacity = '1';
                year.style.transform = 'translateY(0)';
                
                // 如果是高亮年份，添加特殊效果
                if (year.classList.contains('highlight')) {
                    setTimeout(() => {
                        year.style.transform = 'scale(1.05)';
                        year.style.boxShadow = '0 5px 15px rgba(66, 153, 225, 0.3)';
                        
                        setTimeout(() => {
                            year.style.transform = 'scale(1)';
                        }, 300);
                    }, 500);
                }
            }, index * 150);
        });
    }
    
    // 初始化所有功能
    function initAll() {
        initTableSort();
        initTableFilter();
        addChartHoverEffects();
        createParticleBackground();
        
        // 初始动画
        setTimeout(() => {
            animateNumbers();
            animateCharts();
            animateTrendData();
        }, 500);
        
        console.log('数据中心交互功能和动画效果初始化完成');
    }
    
    // 调用初始化函数
    initAll();
}); 