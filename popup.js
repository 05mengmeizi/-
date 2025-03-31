// 更新UI显示
function updateUI(data) {
    // 更新博主姓名
    const bloggerNameElement = document.getElementById('bloggerName');
    if (bloggerNameElement) {
        bloggerNameElement.textContent = data.bloggerName || '未知博主';
    }

    // 更新自然阅读量状态
    const naturalReadsElement = document.getElementById('naturalReadsStatus');
    if (naturalReadsElement) {
        naturalReadsElement.className = `status-item ${data.naturalReads >= 5 ? 'valid' : 'invalid'}`;
        naturalReadsElement.querySelector('.status-value').textContent = 
            `最近8条笔记中${data.naturalReads}条达到自然流量要求`;
    }

    // 更新发现页阅读量比例状态
    const discoveryReadElement = document.getElementById('discoveryReadStatus');
    if (discoveryReadElement) {
        discoveryReadElement.className = `status-item ${data.discoveryReadRatio >= 60 ? 'valid' : 'invalid'}`;
        discoveryReadElement.querySelector('.status-value').textContent = 
            `${data.discoveryReadRatio.toFixed(1)}%`;
    }

    // 更新发现页曝光量比例状态
    const discoveryExposureElement = document.getElementById('discoveryExposureStatus');
    if (discoveryExposureElement) {
        discoveryExposureElement.className = `status-item ${data.discoveryExposureRatio >= 60 ? 'valid' : 'invalid'}`;
        discoveryExposureElement.querySelector('.status-value').textContent = 
            `${data.discoveryExposureRatio.toFixed(1)}%`;
    }

    // 更新女粉比例状态
    const femaleRatioElement = document.getElementById('femaleRatioStatus');
    if (femaleRatioElement) {
        femaleRatioElement.className = `status-item ${data.femaleRatio >= 85 ? 'valid' : 'invalid'}`;
        femaleRatioElement.querySelector('.status-value').textContent = 
            `${data.femaleRatio.toFixed(1)}%`;
    }

    // 更新兴趣标签状态
    const interestTagsElement = document.getElementById('interestTagsStatus');
    if (interestTagsElement) {
        interestTagsElement.className = `status-item ${data.hasBeautyInterest ? 'valid' : 'invalid'}`;
        const tagsContainer = document.getElementById('interestTags');
        if (tagsContainer) {
            tagsContainer.innerHTML = data.topInterests
                .map(tag => `<span class="interest-tag">${tag.name} (${tag.percent}%)</span>`)
                .join('');
        }
    }

    // 更新年龄分布状态
    const ageDistributionElement = document.getElementById('ageDistributionStatus');
    if (ageDistributionElement) {
        ageDistributionElement.className = `status-item ${data.hasCorrectAgeDistribution ? 'valid' : 'invalid'}`;
        ageDistributionElement.querySelector('.status-value').textContent = 
            data.hasCorrectAgeDistribution ? '18-24岁年龄段占比最高' : '18-24岁年龄段占比不是最高';
    }

    // 更新整体状态
    const overallStatusElement = document.getElementById('overallStatus');
    if (overallStatusElement) {
        if (data.isValid) {
            overallStatusElement.className = 'overall-status valid';
            overallStatusElement.textContent = '符合要求';
        } else if (data.invalidReason.includes('待定')) {
            overallStatusElement.className = 'overall-status pending';
            overallStatusElement.textContent = '待定';
        } else {
            overallStatusElement.className = 'overall-status invalid';
            overallStatusElement.textContent = '不符合要求';
        }
    }

    // 更新不合格原因
    const invalidReasonElement = document.getElementById('invalidReason');
    if (invalidReasonElement && data.invalidReason) {
        invalidReasonElement.className = 'invalid-reason';
        invalidReasonElement.textContent = data.invalidReason;
    }
}

// 获取当前标签页并分析数据
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'analyzeData'}, function(response) {
            if (response) {
                updateUI(response);
            }
        });
    }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'dataAnalyzed') {
        updateUI(message.data);
    }
}); 