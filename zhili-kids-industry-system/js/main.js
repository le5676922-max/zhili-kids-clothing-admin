// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 从API加载首页统计数据
    async function loadHomepageStats() {
        try {
            const response = await fetch('/api/data-center/industry-overview');
            const result = await response.json();
            if (result.code === 200 && result.data) {
                const data = result.data;
                const dataCards = document.querySelectorAll('.data-content .data-number');
                if (dataCards.length >= 4) {
                    dataCards[0].textContent = data.registeredCompanies || '1,256';
                    if (data.totalOutput) dataCards[1].textContent = data.totalOutput;
                    if (data.annualProduction) dataCards[2].textContent = data.annualProduction;
                    if (data.employees) dataCards[3].textContent = data.employees;
                }
                const trends = document.querySelectorAll('.data-content .data-trend');
                if (trends.length >= 4) {
                    if (data.outputGrowth) {
                        const firstPercent = trends[0].querySelector('span');
                        if (firstPercent) firstPercent.textContent = data.outputGrowth;
                    }
                    if (data.productionGrowth) {
                        const secondPercent = trends[2].querySelector('span');
                        if (secondPercent) secondPercent.textContent = data.productionGrowth;
                    }
                }
            }
        } catch (e) {
            console.log('统计数据API暂不可用');
        }
    }
    loadHomepageStats();

    // 初始化Vue应用
    const app = Vue.createApp({
        data() {
            return {
                // 状态数据
                isLoggedIn: false,
                currentUser: null,
                // Banner轮播数据
                banners: [
                    {
                        image: 'images/banner/banner1.jpg',
                        title: '织里镇童装产业数字化转型',
                        description: '推动童装产业链数字化、智能化发展，提高产业协同效率'
                    },
                    {
                        image: 'images/banner/banner2.jpg',
                        title: '织里镇童装产业展览会',
                        description: '展示优质童装产品，促进产业交流与合作'
                    },
                    {
                        image: 'images/banner/banner3.jpg',
                        title: '织里镇产业人才培育计划',
                        description: '培养专业技能人才，助力企业发展'
                    }
                ],
                currentBannerIndex: 0,
                bannerInterval: null
            }
        },
        mounted() {
            // 启动Banner轮播
            this.startBannerSlide();
            // 添加滚动监听
            this.addScrollListeners();
            // 初始化轮播图导航点
            this.initBannerNav();
            // 初始化轮播图箭头
            this.initBannerArrows();
        },
        methods: {
            // Banner轮播函数
            startBannerSlide() {
                // 清除之前的定时器
                if (this.bannerInterval) {
                    clearInterval(this.bannerInterval);
                }
                
                // 为轮播图添加过渡效果类
                const bannerSlider = document.querySelector('.banner-slider');
                if (bannerSlider && !bannerSlider.classList.contains('enhanced')) {
                    bannerSlider.classList.add('enhanced');
                    
                    // 添加先进的过渡效果CSS
                    const style = document.createElement('style');
                    style.innerHTML = `
                        .banner-slider.enhanced .slide {
                            transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease;
                        }
                        
                        .banner-slider.enhanced .slide.active {
                            transform: scale(1);
                            opacity: 1;
                        }
                        
                        .banner-slider.enhanced .slide:not(.active) {
                            transform: scale(0.9);
                            opacity: 0;
                            filter: blur(5px);
                        }
                        
                        .banner-slider.enhanced .slide-content {
                            transform: translateY(20px);
                            transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 1s ease;
                        }
                        
                        .banner-slider.enhanced .slide.active .slide-content {
                            transform: translateY(0);
                            opacity: 1;
                            transition-delay: 0.3s;
                        }
                        
                        .banner-slider.enhanced .slide:not(.active) .slide-content {
                            transform: translateY(20px);
                            opacity: 0;
                        }
                        
                        @keyframes dotProgress {
                            0% { background: linear-gradient(to right, var(--accent-color) 0%, rgba(255,255,255,0.5) 0%); }
                            100% { background: linear-gradient(to right, var(--accent-color) 100%, rgba(255,255,255,0.5) 0%); }
                        }
                        
                        @keyframes fadeInRight {
                            from {
                                opacity: 0;
                                transform: translate3d(100px, 0, 0);
                            }
                            to {
                                opacity: 1;
                                transform: translate3d(0, 0, 0);
                            }
                        }
                        
                        @keyframes fadeInLeft {
                            from {
                                opacity: 0;
                                transform: translate3d(-100px, 0, 0);
                            }
                            to {
                                opacity: 1;
                                transform: translate3d(0, 0, 0);
                            }
                        }
                        
                        @keyframes fadeInUp {
                            from {
                                opacity: 0;
                                transform: translate3d(0, 40px, 0);
                            }
                            to {
                                opacity: 1;
                                transform: translate3d(0, 0, 0);
                            }
                        }
                        
                        .banner-slider.enhanced .slide.active .slide-content h2 {
                            animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.4s forwards;
                            opacity: 0;
                        }
                        
                        .banner-slider.enhanced .slide.active .slide-content p {
                            animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.7s forwards;
                            opacity: 0;
                        }
                        
                        .banner-slider.enhanced .banner-arrow.banner-prev {
                            animation: fadeInLeft 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                        }
                        
                        .banner-slider.enhanced .banner-arrow.banner-next {
                            animation: fadeInRight 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // 设置新的定时器
                this.bannerInterval = setInterval(() => {
                    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
                    this.updateBannerDisplay();
                }, 5000);
            },
            updateBannerDisplay() {
                const slides = document.querySelectorAll('.slide');
                const dots = document.querySelectorAll('.banner-dot');
                if (!slides.length || !dots.length) return;
                slides.forEach((slide, index) => {
                    slide.classList.remove('active', 'prev', 'next');
                    if (index === this.currentBannerIndex) {
                        slide.classList.add('active');
                        const heading = slide.querySelector('h2');
                        const paragraph = slide.querySelector('p');
                        if (heading && paragraph) {
                            heading.style.animation = 'none';
                            paragraph.style.animation = 'none';
                            setTimeout(() => {
                                heading.style.animation = '';
                                paragraph.style.animation = '';
                            }, 10);
                        }
                    } else if (index === (this.currentBannerIndex - 1 + slides.length) % slides.length) {
                        slide.classList.add('prev');
                    } else if (index === (this.currentBannerIndex + 1) % slides.length) {
                        slide.classList.add('next');
                    }
                });
                dots.forEach((dot, index) => {
                    if (index === this.currentBannerIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
                const activeDot = document.querySelector('.banner-dot.active');
                if (activeDot) {
                    activeDot.style.cssText = '';
                    setTimeout(() => {
                        activeDot.style.animation = 'dotProgress 5s linear';
                    }, 10);
                }
            },
            // 初始化轮播图导航点
            initBannerNav() {
                const dots = document.querySelectorAll('.banner-dot');
                const self = this;
                
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        self.currentBannerIndex = index;
                        self.updateBannerDisplay();
                        
                        // 重置轮播定时器
                        self.startBannerSlide();
                    });
                });
            },
            // 初始化轮播图箭头
            initBannerArrows() {
                const prevArrow = document.querySelector('.banner-prev');
                const nextArrow = document.querySelector('.banner-next');
                const self = this;
                
                if (prevArrow) {
                    prevArrow.addEventListener('click', () => {
                        self.currentBannerIndex = (self.currentBannerIndex - 1 + self.banners.length) % self.banners.length;
                        self.updateBannerDisplay();
                        
                        // 重置轮播定时器
                        self.startBannerSlide();
                    });
                }
                
                if (nextArrow) {
                    nextArrow.addEventListener('click', () => {
                        self.currentBannerIndex = (self.currentBannerIndex + 1) % self.banners.length;
                        self.updateBannerDisplay();
                        
                        // 重置轮播定时器
                        self.startBannerSlide();
                    });
                }
            },
            // 添加滚动动画效果
            addScrollListeners() {
                const sections = document.querySelectorAll('section');
                
                // 创建高级滚动动画样式
                const style = document.createElement('style');
                style.innerHTML = `
                    section {
                        opacity: 0;
                        transform: translateY(30px);
                        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                                    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                        position: relative;
                        z-index: 1;
                    }
                    
                    section.visible {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    
                    section.visible::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
                        pointer-events: none;
                        opacity: 0;
                        z-index: -1;
                        animation: sectionGlow 3s ease-in-out 0.5s forwards;
                    }
                    
                    @keyframes sectionGlow {
                        0% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    
                    .scroll-indicator {
                        position: fixed;
                        top: 50%;
                        right: 20px;
                        transform: translateY(-50%);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 10px;
                        z-index: 1000;
                    }
                    
                    .scroll-dot {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background-color: rgba(44, 82, 130, 0.3);
                        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
                                    background-color 0.3s ease;
                        cursor: pointer;
                    }
                    
                    .scroll-dot.active {
                        transform: scale(1.5);
                        background-color: var(--accent-color);
                    }
                    
                    .scroll-progress {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 0%;
                        height: 3px;
                        background: linear-gradient(to right, var(--primary-color), var(--accent-color));
                        z-index: 1000;
                        transition: width 0.1s ease;
                    }
                `;
                document.head.appendChild(style);
                
                // 创建滚动进度条
                const scrollProgress = document.createElement('div');
                scrollProgress.className = 'scroll-progress';
                document.body.appendChild(scrollProgress);
                
                // 创建滚动指示器
                const scrollIndicator = document.createElement('div');
                scrollIndicator.className = 'scroll-indicator';
                document.body.appendChild(scrollIndicator);
                
                // 为每个区块创建一个指示点
                sections.forEach((section, index) => {
                    const dot = document.createElement('div');
                    dot.className = 'scroll-dot';
                    dot.dataset.index = index;
                    
                    // 点击滚动到对应区块
                    dot.addEventListener('click', () => {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                    
                    scrollIndicator.appendChild(dot);
                });
                
                // 观察区块可见性并更新滚动指示器
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            
                            // 更新滚动指示器
                            const index = Array.from(sections).indexOf(entry.target);
                            const dots = document.querySelectorAll('.scroll-dot');
                            
                            dots.forEach((dot, i) => {
                                if (i === index) {
                                    dot.classList.add('active');
                                } else {
                                    dot.classList.remove('active');
                                }
                            });
                        }
                    });
                }, { threshold: 0.3 });

                sections.forEach(section => {
                    observer.observe(section);
                });
                
                // 监听滚动事件更新进度条
                window.addEventListener('scroll', () => {
                    const scrollTop = window.scrollY;
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollPercentage = (scrollTop / scrollHeight) * 100;
                    
                    scrollProgress.style.width = `${scrollPercentage}%`;
                    
                    // 添加视差滚动效果
                    const parallaxElements = document.querySelectorAll('.parallax-section');
                    parallaxElements.forEach(el => {
                        const speed = 0.2;
                        const yPos = -(scrollTop * speed);
                        const backgroundPos = `50% ${yPos}px`;
                        
                        if (el.querySelector('.parallax-layer')) {
                            el.querySelector('.parallax-layer').style.transform = `translate3d(0, ${yPos}px, 0)`;
                        }
                    });
                });
            },
            // 模拟登录/注销功能
            login() {
                // 这里只是模拟，实际应调用后端API
                this.isLoggedIn = true;
                this.currentUser = {
                    name: '测试用户',
                    avatar: 'images/avatar.jpg'
                };
            },
            logout() {
                this.isLoggedIn = false;
                this.currentUser = null;
            }
        }
    });

    // 全局组件
    app.component('data-card', {
        props: ['icon', 'title', 'value', 'trend', 'percentage'],
        template: `
            <div class="data-card">
                <div class="data-icon">
                    <i :class="'icon-' + icon"></i>
                </div>
                <div class="data-content">
                    <h3>{{ title }}</h3>
                    <p class="data-number">{{ value }}</p>
                    <p :class="'data-trend ' + trend">较上月<span>{{ percentage }}</span></p>
                </div>
            </div>
        `
    });

    // 挂载Vue应用
    app.mount('#app');

    // Vue 挂载后会接管 #app 内 DOM，需在挂载后重新渲染头部（头像、昵称、退出登录）
    if (window.renderAuthHeader) window.renderAuthHeader();

    // 添加额外的交互效果
    addInteractions();

    // Stagewise 工具栏的 CDN 脚本为 ES Module（含 export），用普通 <script> 加载会报
    // Uncaught SyntaxError: Unexpected token 'export'，并污染控制台；已关闭。
    // 若需使用，请改为 type="module" 的动态 import 或官方 UMD 包。
    // initStagewise();
});

// 添加页面交互效果
function addInteractions() {
    // 滚动时头部导航栏效果
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 为所有带动画效果的元素添加可见性类
    const animatedElements = document.querySelectorAll('.data-card, .enterprise-item, .job-item, .course-item');
    
    // 初始设置
    animatedElements.forEach(el => {
        el.classList.add('animated');
    });

    // 移动端菜单切换
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<span></span><span></span><span></span>';
    
    const header_container = document.querySelector('.header .container');
    const mainNav = document.querySelector('.main-nav');
    
    if (header_container && mainNav) {
        header_container.insertBefore(menuToggle, mainNav);
        
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    
    // 添加高级特效
    addAdvancedEffects();
}

// 添加CSS类用于滚动动画
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.innerHTML = `
        section {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        section.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .animated {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.4s ease, transform 0.4s ease;
        }
        
        section.visible .animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .header.scrolled {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        /* 移动端菜单样式 */
        .menu-toggle {
            display: none;
            flex-direction: column;
            justify-content: space-between;
            width: 30px;
            height: 22px;
            cursor: pointer;
            z-index: 1000;
        }
        
        .menu-toggle span {
            display: block;
            height: 3px;
            width: 100%;
            background-color: var(--primary-color);
            border-radius: 3px;
            transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .menu-toggle {
                display: flex;
            }
            
            .main-nav {
                position: fixed;
                top: 70px;
                left: 0;
                width: 100%;
                background-color: white;
                height: 0;
                overflow: hidden;
                transition: height 0.3s ease;
                z-index: 999;
                box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
            }
            
            .main-nav.active {
                height: auto;
                padding: 20px 0;
            }
            
            .main-nav ul {
                flex-direction: column;
            }
            
            .main-nav li {
                margin: 10px 0;
            }
        }
    `;
    
    document.head.appendChild(style);
});

// Stagewise 工具栏（已禁用）：其 dist/index.js 为 ESM，非 module 方式加载会触发 SyntaxError。
// function initStagewise() { ... }

// 添加高级交互特效
function addAdvancedEffects() {
    // 初始化粒子背景
    initParticlesBackground();
    
    // 初始化滚动视差效果
    initParallaxEffects();
    
    // 添加悬停3D效果
    addTiltEffects();
    
    // 添加页面元素进场动画
    enhanceElementAnimations();

    // 添加鼠标跟随效果
    addMouseFollowEffect();
}

// 初始化粒子背景效果
function initParticlesBackground() {
    // 创建粒子容器
    const particlesContainer = document.createElement('div');
    particlesContainer.id = 'particles-background';
    particlesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
    `;
    document.body.prepend(particlesContainer);

    // 创建粒子
    const particlesCount = window.innerWidth < 768 ? 30 : 60;
    for (let i = 0; i < particlesCount; i++) {
        createParticle(particlesContainer);
    }
}

// 创建单个粒子
function createParticle(container) {
    const particle = document.createElement('div');
    
    // 随机尺寸和位置
    const size = Math.random() * 5 + 1;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const opacity = Math.random() * 0.3 + 0.1;
    const animDuration = Math.random() * 20 + 10;
    const animDelay = Math.random() * 10;
    
    // 设置粒子样式
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: var(--primary-color);
        opacity: ${opacity};
        border-radius: 50%;
        top: ${posY}%;
        left: ${posX}%;
        animation: float ${animDuration}s ease-in-out ${animDelay}s infinite alternate;
        pointer-events: none;
    `;
    
    container.appendChild(particle);
}

// 初始化滚动视差效果
function initParallaxEffects() {
    // 添加视差CSS
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(10px, 10px) rotate(360deg); }
        }
        
        .parallax-section {
            position: relative;
            overflow: hidden;
        }
        
        .parallax-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
    `;
    document.head.appendChild(styleEl);
    
    // 获取可以添加视差效果的部分
    const sections = document.querySelectorAll('.banner, .industry-overview, .latest-news, .hot-enterprises');
    
    sections.forEach(section => {
        section.classList.add('parallax-section');
        
        // 创建视差层
        const layer = document.createElement('div');
        layer.classList.add('parallax-layer');
        
        // 根据不同区块添加不同的背景
        let bgPattern;
        if (section.classList.contains('banner')) {
            bgPattern = 'radial-gradient(circle at center, rgba(66, 153, 225, 0.1) 0%, rgba(255, 255, 255, 0) 70%)';
        } else if (section.classList.contains('industry-overview')) {
            bgPattern = 'linear-gradient(135deg, rgba(66, 153, 225, 0.05) 0%, rgba(255, 255, 255, 0) 50%)';
        } else if (section.classList.contains('latest-news')) {
            bgPattern = 'linear-gradient(45deg, rgba(245, 101, 101, 0.05) 0%, rgba(255, 255, 255, 0) 50%)';
        } else {
            bgPattern = 'radial-gradient(circle at center, rgba(44, 82, 130, 0.05) 0%, rgba(255, 255, 255, 0) 60%)';
        }
        
        layer.style.background = bgPattern;
        section.prepend(layer);
    });
    
    // 添加鼠标移动监听，实现视差效果
    document.addEventListener('mousemove', function(e) {
        const layers = document.querySelectorAll('.parallax-layer');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        layers.forEach(layer => {
            const moveX = (mouseX - 0.5) * 20;
            const moveY = (mouseY - 0.5) * 20;
            layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        });
    });
}

// 添加元素3D倾斜效果
function addTiltEffects() {
    const tiltElements = document.querySelectorAll('.data-card, .enterprise-item, .course-item');
    
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 15;
            const angleY = (centerX - x) / 15;
            
            this.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.05, 1.05, 1.05)`;
            this.style.transition = 'transform 0.1s';
            
            // 添加光泽效果
            const glare = document.createElement('div');
            glare.classList.add('glare-effect');
            
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;
            
            if (!this.querySelector('.glare-effect')) {
                glare.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%);
                    pointer-events: none;
                    z-index: 1;
                    opacity: 0;
                    transition: opacity 0.3s;
                `;
                this.style.position = 'relative';
                this.appendChild(glare);
                
                setTimeout(() => {
                    glare.style.opacity = '1';
                }, 10);
            } else {
                const existingGlare = this.querySelector('.glare-effect');
                existingGlare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`;
            }
        });
        
        el.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.transition = 'transform 0.5s';
            
            const glare = this.querySelector('.glare-effect');
            if (glare) {
                glare.style.opacity = '0';
                setTimeout(() => {
                    glare.remove();
                }, 300);
            }
        });
    });
}

// 增强元素进场动画
function enhanceElementAnimations() {
    // 为不同类型的元素设置不同的动画类型
    const animationTargets = [
        {selector: '.data-card', animation: 'fadeInUp'},
        {selector: '.enterprise-item', animation: 'fadeInLeft'},
        {selector: '.job-item', animation: 'fadeInRight'},
        {selector: '.news-item', animation: 'fadeInUp'},
        {selector: '.course-item', animation: 'zoomIn'},
        {selector: '.section-title', animation: 'fadeIn'},
        {selector: '.banner-slider', animation: 'fadeIn'}
    ];
    
    // 添加动画CSS
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translate3d(0, 30px, 0);
            }
            to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
            }
        }
        
        @keyframes fadeInLeft {
            from {
                opacity: 0;
                transform: translate3d(-30px, 0, 0);
            }
            to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
            }
        }
        
        @keyframes fadeInRight {
            from {
                opacity: 0;
                transform: translate3d(30px, 0, 0);
            }
            to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
            }
        }
        
        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale3d(0.9, 0.9, 0.9);
            }
            to {
                opacity: 1;
                transform: scale3d(1, 1, 1);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleEl);
    
    // 设置动画监听器
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 找到对应的动画类型
                for (const target of animationTargets) {
                    if (entry.target.matches(target.selector)) {
                        entry.target.style.animation = `${target.animation} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
                        
                        // 为子元素添加延迟动画
                        if (entry.target.children.length > 1) {
                            Array.from(entry.target.children).forEach((child, index) => {
                                child.style.opacity = '0';
                                child.style.animation = `${target.animation} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s forwards`;
                            });
                        }
                        break;
                    }
                }
            }
        });
    }, { threshold: 0.1 });
    
    // 观察所有可能的动画元素
    animationTargets.forEach(target => {
        document.querySelectorAll(target.selector).forEach(el => {
            el.style.opacity = '0';
            observer.observe(el);
        });
    });
}

// 添加鼠标跟随效果
function addMouseFollowEffect() {
    // 创建鼠标跟随元素
    const follower = document.createElement('div');
    follower.className = 'mouse-follower';
    follower.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(44, 82, 130, 0.3);
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 9999;
        mix-blend-mode: difference;
        transition: transform 0.3s ease, width 0.3s ease, height 0.3s ease;
        opacity: 0;
    `;
    document.body.appendChild(follower);

    // 创建鼠标指针环绕效果
    const cursor = document.createElement('div');
    cursor.className = 'mouse-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: var(--primary-color);
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(cursor);

    // 鼠标移动事件
    document.addEventListener('mousemove', e => {
        // 主光标直接跟随鼠标
        cursor.style.opacity = '1';
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        
        // 光环稍微延迟跟随，产生拖尾效果
        setTimeout(() => {
            follower.style.opacity = '0.6';
            follower.style.left = `${e.clientX}px`;
            follower.style.top = `${e.clientY}px`;
        }, 100);
        
        // 检测是否在可交互元素上
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && (element.tagName === 'A' || element.tagName === 'BUTTON' || element.closest('.data-card') || element.closest('.course-item') || element.closest('.job-item') || element.closest('.news-item') || element.closest('.enterprise-item'))) {
            follower.style.transform = 'translate(-50%, -50%) scale(1.5)';
            follower.style.background = 'rgba(245, 101, 101, 0.2)';
        } else {
            follower.style.transform = 'translate(-50%, -50%) scale(1)';
            follower.style.background = 'rgba(44, 82, 130, 0.3)';
        }
    });
    
    // 鼠标点击效果
    document.addEventListener('click', e => {
        // 创建点击波纹效果
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.cssText = `
            position: fixed;
            top: ${e.clientY}px;
            left: ${e.clientX}px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--primary-color);
            transform: translate(-50%, -50%);
            pointer-events: none;
            opacity: 0.8;
            z-index: 9998;
            animation: rippleEffect 0.8s ease-out forwards;
        `;
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 800);
    });
    
    // 添加点击波纹动画
    const rippleStyle = document.createElement('style');
    rippleStyle.innerHTML = `
        @keyframes rippleEffect {
            0% {
                width: 10px;
                height: 10px;
                opacity: 0.8;
            }
            100% {
                width: 80px;
                height: 80px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
    
    // 鼠标离开页面时隐藏自定义光标
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        follower.style.opacity = '0';
    });
    
    // 鼠标进入页面时显示自定义光标
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        follower.style.opacity = '0.6';
    });
}