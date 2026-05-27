/**
 * 简单分页功能
 * 这个脚本专门处理企业信息页面的分页功能
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('分页脚本已加载');
    
    // 初始化分页
    initPagination();
});

// 初始化分页功能
function initPagination() {
    // 获取分页相关元素
    const paginationLinks = document.querySelectorAll('.pagination a');
    const enterpriseCards = document.querySelectorAll('.enterprise-card');
    
    // 当前页码和总页数
    let currentPage = 1;
    const totalPages = 3;
    
    console.log('初始化分页 - 总页数:', totalPages);
    console.log('企业卡片总数:', enterpriseCards.length);
    
    // 显示初始页面
    showPage(currentPage);
    
    // 为分页链接添加点击事件
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pageAction = this.getAttribute('data-page');
            console.log('点击了分页按钮:', pageAction);
            
            // 确定要显示的页码
            let newPage = currentPage;
            
            if (pageAction === 'prev' && currentPage > 1) {
                newPage = currentPage - 1;
            } else if (pageAction === 'next' && currentPage < totalPages) {
                newPage = currentPage + 1;
            } else if (!isNaN(parseInt(pageAction))) {
                newPage = parseInt(pageAction);
            }
            
            // 如果页码有变化，则更新显示
            if (newPage !== currentPage) {
                currentPage = newPage;
                showPage(currentPage);
            }
        });
    });
    
    // 显示指定页面
    function showPage(page) {
        console.log('显示第', page, '页');
        
        // 更新分页按钮状态
        paginationLinks.forEach(link => {
            const linkPage = link.getAttribute('data-page');
            
            // 移除所有active类
            link.classList.remove('active');
            
            // 设置当前页为active
            if (linkPage == page) {
                link.classList.add('active');
            }
            
            // 处理上一页和下一页按钮
            if (linkPage === 'prev') {
                if (page <= 1) {
                    link.classList.add('disabled');
                } else {
                    link.classList.remove('disabled');
                }
            } else if (linkPage === 'next') {
                if (page >= totalPages) {
                    link.classList.add('disabled');
                } else {
                    link.classList.remove('disabled');
                }
            }
        });
        
        // 显示当前页的企业卡片，隐藏其他页的卡片
        let visibleCount = 0;
        
        enterpriseCards.forEach(card => {
            const cardPage = card.getAttribute('data-page');
            
            if (cardPage == page) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        console.log(`第${page}页显示了${visibleCount}张卡片`);
    }
    
    // 显示通知功能已移除
} 