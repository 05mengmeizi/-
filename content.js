// 数据获取和分析函数
async function analyzeData() {
    // 存储分析结果
    let result = {
        bloggerName: '',          // 添加博主姓名字段
        tags: [],
        naturalReads: 0,
        discoveryReadRatio: 0,    // 发现页阅读量占比
        discoveryExposureRatio: 0, // 发现页曝光量占比
        femaleRatio: 0,
        hoverTags: [],
        topInterests: [],         // 添加前五名兴趣标签
        hasBeautyInterest: false, // 是否包含美妆兴趣
        hasCorrectAgeDistribution: false, // 添加年龄分布判断字段
        isValid: false,
        invalidReason: ''
    };

    // 获取页面数据
    try {
        // 获取博主姓名
        const nameElement = document.querySelector('.blogger-name');
        if (nameElement) {
            result.bloggerName = nameElement.textContent.trim();
            console.log('获取到博主姓名:', result.bloggerName);
        }

        // 从URL中获取userId
        const urlMatch = window.location.href.match(/blogger-detail\/([^?]+)/);
        if (urlMatch) {
            const userId = urlMatch[1];
            console.log('从URL获取到userId:', userId);
            try {
                // 获取笔记自然阅读量数据
                const notesResponse = await fetch(`https://pgy.xiaohongshu.com/api/solar/kol/data_v2/notes_detail?advertiseSwitch=0&orderType=1&pageNumber=1&pageSize=8&userId=${userId}&noteType=4&withComponent=false`);
                const notesData = await notesResponse.json();
                
                if (notesData.success && notesData.data && notesData.data.list) {
                    // 计算阅读量大于500的笔记数量
                    const validNotesCount = notesData.data.list.filter(note => note.readNum >= 500).length;
                    console.log('阅读量大于500的笔记数量:', validNotesCount);
                    
                    // 更新自然阅读量判断
                    result.naturalReads = validNotesCount;
                    if (validNotesCount < 5) {
                        result.invalidReason = `最近8条笔记中仅有${validNotesCount}条达到自然流量要求，需要5条及以上`;
                    }
                }

                // 从API获取数据
                const response = await fetch(`https://pgy.xiaohongshu.com/api/solar/kol/data_v3/notes_rate?userId=${userId}&business=0&noteType=3&dateType=1&advertiseSwitch=1`);
                const data = await response.json();
                
                if (data.success && data.data && data.data.pagePercentVo) {
                    console.log('API数据获取成功:', data.data.pagePercentVo);
                    // 从API数据中获取发现页比例
                    if (data.data.pagePercentVo.impHomefeedPercent) {
                        result.discoveryExposureRatio = parseFloat(data.data.pagePercentVo.impHomefeedPercent) * 100;
                        console.log('从API获取到发现页曝光量比例:', result.discoveryExposureRatio);
                    }
                    if (data.data.pagePercentVo.readHomefeedPercent) {
                        result.discoveryReadRatio = parseFloat(data.data.pagePercentVo.readHomefeedPercent) * 100;
                        console.log('从API获取到发现页阅读量比例:', result.discoveryReadRatio);
                    }
                }

                // 获取用户兴趣标签
                const interestsResponse = await fetch(`https://pgy.xiaohongshu.com/api/solar/kol/data/${userId}/fans_profile`);
                const interestsData = await interestsResponse.json();
                
                if (interestsData.success && interestsData.data && interestsData.data.interests) {
                    // 按百分比排序并获取前五名
                    const sortedInterests = interestsData.data.interests
                        .sort((a, b) => b.percent - a.percent)
                        .slice(0, 5);
                    
                    result.topInterests = sortedInterests.map(item => ({
                        name: item.name,
                        percent: (item.percent * 100).toFixed(2)
                    }));
                    
                    // 检查是否包含美妆
                    result.hasBeautyInterest = result.topInterests.some(item => 
                        item.name.includes('美妆') || item.name.includes('护肤') || item.name.includes('彩妆')
                    );
                    
                    console.log('获取到的兴趣标签:', result.topInterests);
                    console.log('是否包含美妆:', result.hasBeautyInterest);
                }

                // 获取用户年龄分布数据
                const ageResponse = await fetch(`https://pgy.xiaohongshu.com/api/solar/kol/data/${userId}/fans_profile`);
                const ageData = await ageResponse.json();
                
                if (ageData.success && ageData.data && ageData.data.ages) {
                    // 找出占比最高的年龄段
                    const maxAgeGroup = ageData.data.ages.reduce((max, current) => 
                        current.percent > max.percent ? current : max
                    );
                    
                    // 判断18-24岁是否是占比最高的年龄段
                    result.hasCorrectAgeDistribution = maxAgeGroup.group === '18-24';
                    console.log('年龄分布判断结果:', {
                        maxAgeGroup: maxAgeGroup.group,
                        maxPercent: maxAgeGroup.percent,
                        isCorrect: result.hasCorrectAgeDistribution
                    });
                }
            } catch (error) {
                console.error('API数据获取失败:', error);
            }
        }

        // 其他DOM数据获取保持不变...
        const tagElements = document.querySelectorAll('.blogger-tag-list .d-tag-content');
        result.tags = Array.from(tagElements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0);

        // 更新女粉比例获取逻辑
        const genderElements = document.querySelectorAll('.age-chart--content--desc');
        for (const el of genderElements) {
            const text = el.textContent.trim();
            console.log('性别比例文本:', text);
            
            // 判断是男性还是女性的比例
            if (text.includes('男性')) {
                // 如果显示的是男性比例，需要用100减去男性比例得到女性比例
                const match = text.match(/(\d+\.?\d*)%/);
                if (match) {
                    const maleRatio = parseFloat(match[1]);
                    if (!isNaN(maleRatio)) {
                        result.femaleRatio = 100 - maleRatio;
                        console.log('计算得到女性比例:', result.femaleRatio);
                    }
                }
            } else if (text.includes('女性')) {
                // 如果直接显示女性比例
                const match = text.match(/(\d+\.?\d*)%/);
                if (match) {
                    result.femaleRatio = parseFloat(match[1]);
                    console.log('直接获取到女性比例:', result.femaleRatio);
                }
            }
        }

        // 添加调试日志
        console.log('获取到的完整数据:', {
            tags: result.tags,
            naturalReads: result.naturalReads,
            discoveryReadRatio: result.discoveryReadRatio,
            discoveryExposureRatio: result.discoveryExposureRatio,
            femaleRatio: result.femaleRatio
        });

        // 判断是否符合要求
        if (result.naturalReads < 5) {
            result.isValid = false;
            result.invalidReason = '不符合要求';
        } else if (result.discoveryReadRatio < 60) {
            result.isValid = false;
            result.invalidReason = '不符合要求';
        } else {
            // 检查其他条件
            let invalidCount = 0;
            let invalidItem = '';
            
            if (result.discoveryExposureRatio < 60) {
                invalidCount++;
                invalidItem = '发现页曝光量比例小于60%';
            }
            if (result.femaleRatio < 85) {
                invalidCount++;
                invalidItem = '女粉比例小于85%';
            }
            if (!result.hasBeautyInterest) {
                invalidCount++;
                invalidItem = '前五名兴趣标签中不包含美妆相关';
            }
            if (!result.hasCorrectAgeDistribution) {
                invalidCount++;
                invalidItem = '18-24岁年龄段占比不是最高';
            }

            if (invalidCount === 0) {
                result.isValid = true;
                result.invalidReason = '';
            } else if (invalidCount === 1) {
                result.isValid = false;
                result.invalidReason = `待定（${invalidItem}）`;
            } else {
                result.isValid = false;
                result.invalidReason = '不符合要求';
            }
        }
    } catch (error) {
        console.error('数据分析出错:', error);
        result.invalidReason = '数据获取失败';
    }

    return result;
}

// 页面加载完成后分析
document.addEventListener('DOMContentLoaded', () => {
    // 延迟执行以确保所有数据都已加载
    setTimeout(() => {
        analyzeData().then(result => {
            chrome.runtime.sendMessage({
                action: 'dataAnalyzed',
                data: result
            });
        });
    }, 1000);
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeData') {
        analyzeData().then(result => {
            sendResponse(result);
        });
        return true;
    }
}); 





