// 更新UI显示数据
function updateUI(data) {
    // 显示博主姓名
    document.getElementById('blogger-name').textContent = data.bloggerName || '-';
    
    // 显示所有标签
    document.getElementById('tags').textContent = data.tags.join(', ') || '-';
    
    // 显示阅读量
    document.getElementById('natural-reads').textContent = 
        `${data.naturalReads || 0}条 ${data.naturalReads < 5 ? '(不合格)' : '(合格)'}`;
    
    // 显示发现页阅读量比例
    document.getElementById('discovery-read-ratio').textContent = 
        `${data.discoveryReadRatio || 0}% ${data.discoveryReadRatio < 60 ? '(不合格)' : '(合格)'}`;
    
    // 显示发现页曝光量比例
    document.getElementById('discovery-exposure-ratio').textContent = 
        `${data.discoveryExposureRatio || 0}% ${data.discoveryExposureRatio < 60 ? '(不合格)' : '(合格)'}`;
    
    // 显示女粉比例
    document.getElementById('female-ratio').textContent = 
        `${data.femaleRatio || 0}% ${data.femaleRatio < 85 ? '(不合格)' : '(合格)'}`;

    // 显示兴趣标签
    const interestsElement = document.getElementById('interests');
    if (interestsElement && data.topInterests) {
        const interestsText = data.topInterests
            .map(item => `${item.name}(${item.percent}%)`)
            .join(', ');
        interestsElement.textContent = interestsText || '-';
    }

    // 更新总体状态
    const statusElement = document.getElementById('status');
    if (data.isValid) {
        statusElement.textContent = '符合要求';
        statusElement.className = 'status success';
    } else {
        statusElement.textContent = data.invalidReason;
        statusElement.className = 'status error';
    }
}

// 获取当前标签页
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    return tab;
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    const tab = await getCurrentTab();
    
    // 检查是否在正确的网页上
    if (!tab.url.includes('pgy.xiaohongshu.com')) {
        document.getElementById('status').textContent = '请在小红书博主页面使用此插件';
        document.getElementById('status').className = 'status warning';
        return;
    }

    // 向content script发送消息获取数据
    chrome.tabs.sendMessage(tab.id, { action: 'analyzeData' }, async (response) => {
        if (response) {
            // 等待Promise解析
            const result = await response;
            updateUI(result);
        } else {
            document.getElementById('status').textContent = '数据获取失败，请刷新页面重试';
            document.getElementById('status').className = 'status error';
        }
    });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'dataAnalyzed') {
        updateUI(message.data);
    }
}); 