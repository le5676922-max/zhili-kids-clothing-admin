document.addEventListener('DOMContentLoaded', function() {
    // 标签页切换功能
    const tabItems = document.querySelectorAll('.market-nav li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有标签页的活动状态
            tabItems.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加当前标签页的活动状态
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // 模拟图表数据加载
    function simulateChartLoading() {
        const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
        chartPlaceholders.forEach(placeholder => {
            // 这里可以添加实际图表加载逻辑
            // 例如使用Chart.js、ECharts等库来创建图表
            console.log('加载图表:', placeholder);
        });
    }
    
    simulateChartLoading();
    
    // 添加趋势卡片悬停效果
    const trendCards = document.querySelectorAll('.trend-card');
    trendCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });
    
    // 行业资讯标签筛选功能
    const newsTags = document.querySelectorAll('.news-tag');
    if (newsTags.length > 0) {
        newsTags.forEach(tag => {
            tag.addEventListener('click', function() {
                // 移除所有标签的活动状态
                newsTags.forEach(t => t.classList.remove('active'));
                
                // 添加当前标签的活动状态
                this.classList.add('active');
                
                // 这里可以添加实际的资讯筛选逻辑
                const category = this.textContent.trim();
                console.log('筛选资讯类别:', category);
                
                // 模拟筛选效果
                const newsItems = document.querySelectorAll('.news-item');
                if (category === '全部资讯') {
                    newsItems.forEach(item => item.style.display = 'flex');
                } else {
                    newsItems.forEach(item => {
                        const itemCategory = item.querySelector('.news-category').textContent.trim();
                        item.style.display = (itemCategory === category) ? 'flex' : 'none';
                    });
                }
            });
        });
    }
    
    // 政策法规分类切换功能
    const policyCategories = document.querySelectorAll('.policy-category');
    if (policyCategories.length > 0) {
        policyCategories.forEach(category => {
            category.addEventListener('click', function() {
                // 移除所有分类的活动状态
                policyCategories.forEach(c => c.classList.remove('active'));
                
                // 添加当前分类的活动状态
                this.classList.add('active');
                
                // 这里可以添加实际的政策筛选逻辑
                const categoryType = this.querySelector('span').textContent.trim();
                console.log('筛选政策类别:', categoryType);
                
                // 模拟筛选效果
                const policyItems = document.querySelectorAll('.policy-item');
                policyItems.forEach(item => {
                    const itemType = item.querySelector('.policy-type').textContent.trim();
                    
                    // 简单模拟匹配逻辑，实际项目中可能需要更精确的匹配
                    let shouldShow = false;
                    if (categoryType === '国家政策' && itemType.includes('国家')) shouldShow = true;
                    else if (categoryType === '行业标准' && itemType.includes('标准')) shouldShow = true;
                    else if (categoryType === '地方政策' && itemType.includes('地方')) shouldShow = true;
                    else if (categoryType === '国际法规' && itemType.includes('国际')) shouldShow = true;
                    
                    item.style.display = shouldShow ? 'flex' : 'none';
                });
            });
        });
    }
    
    // 展会时间轴项目悬停效果
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length > 0) {
        timelineItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f8f9fa';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
        });
    }
    
    // 市场分析报告项目悬停效果
    const reportItems = document.querySelectorAll('.report-item');
    if (reportItems.length > 0) {
        reportItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f1f4f8';
                this.style.transform = 'translateY(-3px)';
                this.style.transition = 'all 0.3s ease';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#f8f9fa';
                this.style.transform = '';
            });
        });
    }
    
    // 图表描述展开/收起功能
    const chartDescriptions = document.querySelectorAll('.chart-description');
    if (chartDescriptions.length > 0) {
        chartDescriptions.forEach(desc => {
            // 创建展开/收起按钮
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn-toggle-desc';
            toggleBtn.textContent = '展开详情';
            toggleBtn.style.fontSize = '12px';
            toggleBtn.style.border = 'none';
            toggleBtn.style.background = 'none';
            toggleBtn.style.color = 'var(--primary-color)';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.padding = '5px 0';
            
            // 保存原始内容和截断内容
            const fullText = desc.querySelector('p').textContent;
            const truncatedText = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
            
            // 如果文本足够长，添加展开/收起功能
            if (fullText.length > 100) {
                desc.querySelector('p').textContent = truncatedText;
                desc.appendChild(toggleBtn);
                
                let expanded = false;
                toggleBtn.addEventListener('click', function() {
                    if (expanded) {
                        desc.querySelector('p').textContent = truncatedText;
                        toggleBtn.textContent = '展开详情';
                    } else {
                        desc.querySelector('p').textContent = fullText;
                        toggleBtn.textContent = '收起';
                    }
                    expanded = !expanded;
                });
            }
        });
    }
    
    // 添加分页功能
    const paginationLinks = document.querySelectorAll('.pagination a');
    if (paginationLinks.length > 0) {
        paginationLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 移除所有页码的活动状态
                paginationLinks.forEach(l => l.classList.remove('active'));
                
                // 如果不是上一页/下一页按钮，添加活动状态
                if (!this.classList.contains('prev') && !this.classList.contains('next')) {
                    this.classList.add('active');
                }
                
                // 这里可以添加实际的分页加载逻辑
                const pageNum = this.textContent;
                console.log('加载页码:', pageNum);
            });
        });
    }
    
    // 阅读全文功能实现
    function setupReadMoreButtons() {
        // 创建模态框元素
        const modal = document.createElement('div');
        modal.className = 'news-modal';
        modal.innerHTML = `
            <div class="news-modal-content">
                <span class="news-modal-close">&times;</span>
                <div class="news-modal-header">
                    <h2 class="news-modal-title"></h2>
                    <div class="news-modal-meta">
                        <span class="news-modal-date"></span>
                        <span class="news-modal-category"></span>
                    </div>
                </div>
                <div class="news-modal-body">
                    <div class="news-modal-image">
                        <img src="" alt="">
                    </div>
                    <div class="news-modal-text"></div>
                </div>
                <div class="news-modal-footer">
                    <div class="news-modal-tags"></div>
                    <div class="news-modal-share">
                        <button class="btn-share"><i class="bi bi-share"></i> 分享</button>
                        <button class="btn-favorite"><i class="bi bi-bookmark"></i> 收藏</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 获取所有阅读全文按钮
        const readMoreButtons = document.querySelectorAll('.news-footer .btn-outline.btn-sm');
        
        // 定义新闻内容数据
        const newsData = [
            {
                id: 1,
                title: "2025年童装行业发展报告发布，智能科技融合成为主流趋势",
                date: "2025-07-15",
                category: "行业动态",
                image: "../images/products/special/special-costume-01.jpg",
                content: `<p>中国服装协会发布的《2025年童装行业发展报告》显示，生物可降解材料、智能穿戴技术以及个性化定制成为行业三大增长点，消费者对产品功能性与环保性要求持续提高。</p>
                <p>报告数据显示，2025年中国童装市场规模达3,580亿元，同比增长9.5%。其中，智能童装市场规模达565亿元，同比增长32.8%；环保材质童装市场规模达1,676亿元，同比增长15.2%。</p>
                <p>功能性方面，具有温度调节、防紫外线、防水透气、抗菌防霉、智能监测等功能的童装产品受到市场青睐，占比达到38.7%。智能面料方面，具有生长适应、温度感应、光感变色、安全监测等功能的面料成为研发热点。</p>
                <p>产品趋势方面，报告指出"多功能集成"成为童装产品设计主流，一件产品集成多种功能需求，如可调节尺码的"成长型"服装、季节转换型设计、亲子装互换设计等解决方案受到消费者欢迎。</p>
                <p>零售渠道方面，线上销售占比达到58.3%，继续保持增长态势。虚拟试衣、3D定制、AI风格推荐等数字化工具被广泛应用于童装电商平台，提升了消费者体验。</p>
                <p>值得关注的是，报告首次将"元宇宙童装消费"纳入统计指标，数据显示已有12.5%的家长在元宇宙平台为孩子的虚拟形象购买了数字服装，这一新兴消费领域预计在未来五年内将保持高速增长。</p>`,
                tags: ["智能童装", "行业报告", "发展趋势", "消费数据"]
            },
            {
                id: 2,
                title: "全球童装可持续发展标准更新，碳足迹标签强制执行",
                date: "2025-07-10",
                category: "政策解读",
                image: "../images/products/seasonal/seasonal-sweater-01.jpg",
                content: `<p>国际纺织服装联盟发布新版《全球童装可持续发展标准》，要求所有童装产品必须标注碳足迹数据，并逐步淘汰无法达到再循环标准的合成材料。</p>
                <p>新标准规定，从2026年1月1日起，出口至欧美日等发达国家和地区的童装产品必须在标签上清晰标注产品生命周期碳足迹数据，包括原材料获取、生产制造、物流运输等环节的碳排放量。同时，要求产品包装材料必须使用可生物降解材料，禁止使用传统塑料包装。</p>
                <p>在材料使用方面，新标准提高了有机认证和环保认证的要求，明确规定到2028年，童装产品中的合成纤维含量不得超过30%，且必须达到可回收再利用标准。对于婴幼儿服装，甲醛、重金属等有害物质的限量标准较现行标准降低了40%。</p>
                <p>新标准还对生产过程中的用水、用电、废弃物处理等方面提出了更严格的要求，生产企业必须使用清洁能源比例不低于50%，废水处理必须达到饮用水标准才能排放，固体废弃物回收利用率不低于95%。</p>
                <p>标准发布后，全球多个国家和地区宣布将依据新标准修订本国童装产品进口政策。中国服装协会表示，将帮助国内企业尽快适应新标准要求，引导产业加速绿色转型，确保中国童装产品继续保持国际市场竞争力。</p>
                <p>业内专家指出，新标准的实施将对全球童装产业链产生深远影响，预计将加速淘汰落后产能，推动产业向更加环保、智能、透明的方向发展。对中国织里等童装产业集群而言，这既是挑战也是转型升级的机遇。</p>`,
                tags: ["可持续发展", "碳足迹", "国际标准", "环保认证"]
            },
            {
                id: 3,
                title: "织里智能童装产业园正式投产，年产能突破2亿件",
                date: "2025-07-05",
                category: "技术创新",
                image: "../images/products/boys/boys-tshirt-01.jpg",
                content: `<p>织里智能童装产业园投资50亿元打造的智能制造基地正式投产，引入全自动裁剪系统、机器人缝制线和AI品控系统，产线效率较传统工厂提升3倍，能耗降低40%。</p>
                <p>该产业园占地面积1200亩，总建筑面积85万平方米，是目前全球规模最大、智能化程度最高的童装专业制造基地。产业园集成了工业互联网、5G、云计算、人工智能等新一代信息技术，实现了设计、生产、仓储、物流全流程数字化管理。</p>
                <p>在生产线方面，产业园配备了350条智能生产线，其中包括120条全自动机器人缝制生产线，实现了从面料铺设、裁剪到缝制、整烫的全流程自动化。特别是引入的第四代智能裁床，可以根据面料特性自动调整裁剪参数，将面料利用率提升至96.8%，大幅降低了材料浪费。</p>
                <p>在质量控制方面，产业园采用AI视觉检测系统，可以实时监控生产过程中的每个环节，对面料瑕疵、缝制不良、尺寸偏差等问题进行自动识别和预警，不良品检出率达99.8%，远高于人工检验的85%水平。</p>
                <p>在能源管理方面，产业园屋顶安装了60MW光伏发电系统，厂区内建有智能微电网，可实现用电负荷的智能调配。同时，采用了中水回用系统和余热回收系统，将生产过程中的水资源循环利用率提升至85%，能源综合利用效率提升40%。</p>
                <p>织里镇政府表示，智能产业园的投产将带动当地3000多家童装企业加速数字化转型，预计到2027年，织里童装产业集群的智能制造覆盖率将达到80%以上，年产值有望突破1000亿元。</p>`,
                tags: ["智能制造", "产业园", "自动化", "数字化"]
            },
            {
                id: 4,
                title: "全球首个童装元宇宙展示平台上线，虚拟试衣体验革新销售模式",
                date: "2025-06-28",
                category: "企业新闻",
                image: "../images/products/girls/girls-dress-01.jpg",
                content: `<p>由织里镇数字经济促进中心联合多家企业开发的童装元宇宙展示平台正式上线，消费者可通过3D扫描创建虚拟替身，实现高精度在线试衣，首月注册用户突破百万。</p>
                <p>这一全球首创的童装专用元宇宙平台采用了先进的AR/VR技术、真实物理引擎和AI辅助设计系统，让消费者能够在虚拟环境中为孩子挑选并试穿童装。与传统网购不同，该平台可以根据上传的孩子体型数据，创建精确的虚拟替身，并模拟不同面料、不同尺码的实际穿着效果，解决了网购童装尺码不合适、实物与图片差异大等痛点问题。</p>
                <p>平台还具备强大的社交功能，家长可以邀请亲友共同参与选购过程，分享试穿效果，共同决策。此外，平台支持用户创建个人风格画板，系统会根据偏好智能推荐相似风格的新品，打造个性化购物体验。</p>
                <p>在供应链方面，该平台与织里超过500家童装生产企业建立了数字化连接，消费者的订单数据可以直接传输到制造端，支持按需生产和个性化定制，将生产周期从传统的15-30天缩短至3-5天。</p>
                <p>值得注意的是，平台还引入了数字藏品功能，知名设计师可以在平台上发布限量款数字服装，用户购买后可以在虚拟空间穿戴，也可以兑换实体产品。首批上线的100套限量数字藏品在12小时内售罄，最高单价达到5200元。</p>
                <p>据悉，该平台计划在今年内接入国内主要童装品牌，并将逐步开放海外市场。行业分析师认为，这一创新模式将重塑童装零售业态，有望成为未来童装营销的重要渠道。</p>`,
                tags: ["元宇宙", "虚拟试衣", "数字藏品", "创新零售"]
            }
        ];
        
        // 为每个阅读全文按钮添加点击事件
        readMoreButtons.forEach((button, index) => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 获取当前新闻项的数据
                const newsItem = newsData[index] || {
                    id: index + 1,
                    title: button.closest('.news-item').querySelector('.news-title').textContent,
                    date: button.closest('.news-item').querySelector('.news-date').textContent.replace('i', '').trim(),
                    category: button.closest('.news-item').querySelector('.news-category').textContent,
                    image: button.closest('.news-item').querySelector('.news-image img').src,
                    content: `<p>${button.closest('.news-item').querySelector('.news-summary').textContent}</p>
                              <p>这是一个详细的新闻内容示例，实际项目中应该从服务器获取完整内容。</p>
                              <p>新闻内容包括多个段落，可能还有图片、视频等多媒体元素。</p>
                              <p>点击阅读全文按钮后，用户可以在此查看完整的新闻详情。</p>`,
                    tags: ["童装行业", "发展趋势", "市场信息"]
                };
                
                // 填充模态框内容
                modal.querySelector('.news-modal-title').textContent = newsItem.title;
                modal.querySelector('.news-modal-date').innerHTML = `<i class="bi bi-calendar3"></i> ${newsItem.date}`;
                modal.querySelector('.news-modal-category').textContent = newsItem.category;
                modal.querySelector('.news-modal-image img').src = newsItem.image;
                modal.querySelector('.news-modal-image img').alt = newsItem.title;
                modal.querySelector('.news-modal-text').innerHTML = newsItem.content;
                
                // 填充标签
                let tagsHtml = '';
                if (newsItem.tags && newsItem.tags.length > 0) {
                    newsItem.tags.forEach(tag => {
                        tagsHtml += `<span>${tag}</span>`;
                    });
                    modal.querySelector('.news-modal-tags').innerHTML = tagsHtml;
                }
                
                // 显示模态框
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
                
                // 阅读数统计更新（模拟）
                const viewCount = button.closest('.news-item').querySelector('.news-stats span:first-child');
                if (viewCount) {
                    const currentCount = parseInt(viewCount.textContent.match(/\d+/)[0]);
                    viewCount.innerHTML = `<i class="bi bi-eye"></i> ${currentCount + 1}`;
                }
            });
        });
        
        // 关闭模态框
        const closeBtn = modal.querySelector('.news-modal-close');
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
        
        // 添加分享和收藏功能（模拟）
        const shareBtn = modal.querySelector('.btn-share');
        const favoriteBtn = modal.querySelector('.btn-favorite');
        
        shareBtn.addEventListener('click', function() {
            alert('分享功能已激活，实际项目中可接入社交媒体分享API');
        });
        
        favoriteBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="bi bi-bookmark-fill"></i> 已收藏';
            this.classList.add('active');
            alert('已添加到收藏夹，实际项目中可保存到用户账户');
        });
    }
    
    // 调用阅读全文功能
    setupReadMoreButtons();
    
    // 市场分析图表加载
    function loadMarketAnalysisCharts() {
        // 获取市场分析区域
        const marketAnalysisSection = document.getElementById('market-analysis');
        if (!marketAnalysisSection) return;

        // 创建市场分析图表区域
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'analysis-charts-container';
        
        // 添加各类图表
        chartsContainer.innerHTML = `
            <!-- 市场细分结构图 -->
            <div class="analysis-chart-item">
                <h3>童装市场细分结构</h3>
                <div class="chart-container">
                    <img src="../images/market/market-distribution-chart.jpg" alt="童装市场细分结构图">
                </div>
                <div class="chart-description">
                    <p>2025年童装市场分类占比分析：婴幼儿装占比15.8%，校园服饰占比32.5%，学生装占比21.7%，婴幼儿服装占比17.2%，运动服装占比8.8%，礼服/工装占比4.0%。</p>
                </div>
            </div>

            <!-- 销售渠道占比图 -->
            <div class="analysis-chart-item">
                <h3>童装销售渠道占比</h3>
                <div class="chart-container">
                    <img src="../images/market/market-channel-chart.jpg" alt="童装销售渠道占比图">
                </div>
                <div class="chart-description">
                    <p>2025年线上渠道占比达58.3%，其中大型电商平台占25.5%，网店直营平台占22.8%，元宇宙购物占10.0%；线下渠道中专卖店占18.6%，百货商场占10.5%，超市/便利店占7.4%。</p>
                </div>
            </div>

            <!-- 消费人群年龄分布图 -->
            <div class="analysis-chart-item">
                <h3>童装消费人群年龄分布</h3>
                <div class="chart-container">
                    <img src="../images/market/market-consumer-chart.jpg" alt="童装消费人群年龄分布图">
                </div>
                <div class="chart-description">
                    <p>25-35岁年轻父母仍是童装消费的主力军，占比51.5%，其次是35-45岁中年父母(27.3%)和祖辈消费者(15.8%)，值得注意的是，青少年自主消费比例上升至5.4%。</p>
                </div>
            </div>

            <!-- 品牌市场份额图 -->
            <div class="analysis-chart-item">
                <h3>童装品牌市场份额</h3>
                <div class="chart-container">
                    <img src="../images/market/market-brand-chart.jpg" alt="童装品牌市场份额图">
                </div>
                <div class="chart-description">
                    <p>品牌集中度继续提高，前十大品牌市场份额合计达36.8%，其中十大品牌占比22.5%，国际品牌占比14.3%，第二梯队品牌市场份额达23%。</p>
                </div>
            </div>

            <!-- 产品材质分布图 -->
            <div class="analysis-chart-item">
                <h3>童装产品材质分布</h3>
                <div class="chart-container">
                    <img src="../images/market/market-material-chart.jpg" alt="童装产品材质分布图">
                </div>
                <div class="chart-description">
                    <p>有机棉占比24.5%，再生纤维占比18.3%，生物降解材料占比4.0%，传统棉质占比22.6%，合成材料占比18.2%，混纺面料占比12.4%，环保材质总量已超过传统材料。</p>
                </div>
            </div>

            <!-- 全球市场地区分布图 -->
            <div class="analysis-chart-item">
                <h3>全球童装市场地区分布</h3>
                <div class="chart-container">
                    <img src="../images/market/market-global-chart.jpg" alt="全球童装市场地区分布图">
                </div>
                <div class="chart-description">
                    <p>中国市场占比达到全球的28.6%，欧洲占比24.3%，北美占比22.5%，东南亚占比10.8%，拉丁美洲占比5.7%，中东和非洲占比4.8%，其他地区占比3.3%。</p>
                </div>
            </div>
        `;
        
        // 添加环保和智能指标卡片
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'market-indicators';
        indicatorsContainer.innerHTML = `
            <div class="indicator-card">
                <div class="indicator-icon">
                    <i class="bi bi-recycle"></i>
                </div>
                <div class="indicator-content">
                    <h3>环保材质占比</h3>
                    <div class="indicator-value">46.8<span class="unit">%</span></div>
                    <div class="indicator-trend">
                        <i class="bi bi-arrow-up-right"></i>
                        <span>同比增长15.2%</span>
                    </div>
                </div>
            </div>
            
            <div class="indicator-card">
                <div class="indicator-icon">
                    <i class="bi bi-cpu"></i>
                </div>
                <div class="indicator-content">
                    <h3>智能服装渗透率</h3>
                    <div class="indicator-value">28.5<span class="unit">%</span></div>
                    <div class="indicator-trend">
                        <i class="bi bi-arrow-up-right"></i>
                        <span>同比增长23.6%</span>
                    </div>
                </div>
            </div>
        `;
        
        // 插入到页面
        marketAnalysisSection.appendChild(indicatorsContainer);
        marketAnalysisSection.appendChild(chartsContainer);
        
        // 添加图表交互效果
        const chartItems = document.querySelectorAll('.analysis-chart-item');
        chartItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
    }
    
    // 初始化市场分析图表
    loadMarketAnalysisCharts();
}); 