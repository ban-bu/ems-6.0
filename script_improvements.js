// 碳排放管理系统改进功能
// 这个文件包含对原有系统的改进功能

// 改进1: AI助手刷新功能
function refreshFieldContent(fieldName) {
    const fieldElement = document.querySelector(`[data-field="${fieldName}"] .field-value`);
    if (!fieldElement) return;
    
    // 显示加载状态
    const originalContent = fieldElement.textContent;
    fieldElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI重新生成中...';
    
    // 模拟AI重新生成内容
    setTimeout(() => {
        const newContent = generateSmartFieldContent(fieldName);
        fieldElement.textContent = newContent;
        fieldElement.setAttribute('data-original', newContent);
        
        // 更新存储的数据
        if (window.supplementData) {
            window.supplementData[fieldName] = newContent;
        }
        
        // 显示成功消息
        addAIMessage(`🔄 "${fieldName}"已重新生成：${newContent}`);
    }, 1500);
}

// 根据字段类型生成智能内容
function generateSmartFieldContent(fieldName) {
    const documentType = window.currentAnalysis?.documentType || 'general';
    
    const smartContentGenerators = {
        '供应商地理位置信息': () => {
            const locations = ['江苏苏州', '广东深圳', '浙江杭州', '山东青岛', '河北石家庄', '湖北武汉'];
            const selected = locations[Math.floor(Math.random() * locations.length)];
            return `${selected}（基于${getDocumentTypeName(documentType)}产业集群分析）`;
        },
        '原材料具体规格和来源': () => {
            const materials = {
                electronics: ['芯片-台积电', '金属外壳-富士康', '电池-宁德时代'],
                textile: ['有机棉-新疆', '环保染料-德国巴斯夫', '再生纤维-日本东丽'],
                automotive: ['钢材-宝钢集团', '橡胶-米其林', '电池-比亚迪'],
                general: ['钢材-宝钢集团', '塑料-中石化', '电子元件-富士康']
            };
            const typeMatrials = materials[documentType] || materials.general;
            return typeMatrials.join('，');
        },
        '生产工艺详细流程': () => {
            const processes = {
                electronics: '芯片封装→电路板组装→外壳装配→系统测试→质量检验',
                textile: '纤维处理→纺纱织布→染色印花→裁剪缝制→质量检测',
                automotive: '冲压成型→焊接装配→涂装处理→总装调试→路试检验',
                general: '原料预处理→精密加工→质量检测→组装集成→包装入库'
            };
            return processes[documentType] || processes.general;
        },
        '物流运输方式和路径': () => {
            const logistics = [
                '公路运输为主，平均运距' + (Math.floor(Math.random() * 200) + 200) + '公里',
                '铁路+公路联运，绿色物流占比' + (Math.floor(Math.random() * 30) + 20) + '%',
                '多式联运，海运+陆运结合，成本优化' + (Math.floor(Math.random() * 15) + 10) + '%'
            ];
            return logistics[Math.floor(Math.random() * logistics.length)];
        },
        '产品使用场景和周期': () => {
            const scenarios = {
                electronics: `消费电子产品，典型使用寿命${Math.floor(Math.random() * 5) + 3}-${Math.floor(Math.random() * 3) + 8}年`,
                textile: `日常服装，推荐穿戴周期${Math.floor(Math.random() * 24) + 12}个月`,
                automotive: `交通工具，使用寿命${Math.floor(Math.random() * 5) + 8}-${Math.floor(Math.random() * 5) + 12}年`,
                general: `通用产品，典型使用寿命${Math.floor(Math.random() * 3) + 3}-${Math.floor(Math.random() * 3) + 6}年`
            };
            return scenarios[documentType] || scenarios.general;
        }
    };
    
    const generator = smartContentGenerators[fieldName];
    if (generator) {
        return generator();
    }
    
    // 默认生成
    return `基于${getDocumentTypeName(documentType)}行业特点重新生成的${fieldName}信息`;
}

// 改进2: Kanban和Lean模块的对话记录功能
let aiChatHistory = {
    kanban: [],
    lean: []
};

// 增强的AI对话模态框
function openEnhancedAIModal(emissionType, emissionData, moduleType = 'kanban') {
    selectedEmissionData = { type: emissionType, data: emissionData };
    
    const modal = document.getElementById('aiModal');
    const selectedDataDiv = document.getElementById('selectedData');
    
    const typeNames = {
        procurement: '原料采购',
        manufacturing: '生产制造',
        logistics: '物流运输',
        usage: '产品使用',
        recycling: '回收处理',
        decomposition: '自然降解'
    };
    
    selectedDataDiv.innerHTML = `
        <h4>选中数据: ${typeNames[emissionType]}</h4>
        <p>碳排放值: <strong>${emissionData.value}</strong></p>
        <p>排放级别: <strong>${emissionData.level === 'high' ? '高' : emissionData.level === 'medium' ? '中' : '低'}</strong></p>
        
        <div class="chat-history" id="chatHistory">
            <h5><i class="fas fa-history"></i> 对话记录</h5>
            <div class="history-messages" id="historyMessages">
                ${renderChatHistory(moduleType, emissionType)}
            </div>
        </div>
    `;
    
    // 设置当前模块类型
    modal.setAttribute('data-module', moduleType);
    modal.setAttribute('data-emission-type', emissionType);
    
    modal.style.display = 'flex';
}

// 渲染对话历史
function renderChatHistory(moduleType, emissionType) {
    const history = aiChatHistory[moduleType] || [];
    const relevantHistory = history.filter(item => item.emissionType === emissionType);
    
    if (relevantHistory.length === 0) {
        return '<p class="no-history">暂无对话记录</p>';
    }
    
    return relevantHistory.map(item => `
        <div class="history-item">
            <div class="history-question">
                <i class="fas fa-user"></i> ${item.question}
            </div>
            <div class="history-answer">
                <i class="fas fa-robot"></i> ${item.answer}
            </div>
            <div class="history-time">${item.timestamp}</div>
        </div>
    `).join('');
}

// 增强的AI询问功能
async function askEnhancedAI() {
    const question = document.getElementById('aiQuestion').value.trim();
    if (!question) {
        alert('请输入您的问题');
        return;
    }
    
    const modal = document.getElementById('aiModal');
    const moduleType = modal.getAttribute('data-module');
    const emissionType = modal.getAttribute('data-emission-type');
    
    const responseDiv = document.getElementById('aiResponse');
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI正在分析中...';
    
    try {
        const response = await callAI(question, selectedEmissionData);
        
        // 保存对话记录
        saveAIChatHistory(moduleType, emissionType, question, response);
        
        responseDiv.innerHTML = `
            <h4><i class="fas fa-lightbulb"></i> AI分析结果</h4>
            <div class="ai-analysis">${response}</div>
            <div class="action-buttons" style="margin-top: 1rem;">
                <button class="btn btn-success" onclick="acceptOptimization()">
                    <i class="fas fa-check"></i> 接受优化建议
                </button>
                <button class="btn btn-secondary" onclick="continueConversation()">
                    <i class="fas fa-comments"></i> 继续追问
                </button>
                <button class="btn btn-primary" onclick="closeAiModal()">
                    <i class="fas fa-times"></i> 关闭
                </button>
            </div>
        `;
        
        // 更新对话历史显示
        updateChatHistoryDisplay(moduleType, emissionType);
        
    } catch (error) {
        const mockResponse = generateMockAIResponse(question, selectedEmissionData);
        
        // 保存模拟对话记录
        saveAIChatHistory(moduleType, emissionType, question, mockResponse);
        
        responseDiv.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                AI服务暂时不可用，以下是模拟分析结果：
            </div>
            <div class="ai-analysis">${mockResponse}</div>
            <div class="action-buttons" style="margin-top: 1rem;">
                <button class="btn btn-success" onclick="acceptOptimization()">
                    <i class="fas fa-check"></i> 接受优化建议
                </button>
                <button class="btn btn-secondary" onclick="continueConversation()">
                    <i class="fas fa-comments"></i> 继续追问
                </button>
                <button class="btn btn-primary" onclick="closeAiModal()">
                    <i class="fas fa-times"></i> 关闭
                </button>
            </div>
        `;
        
        // 更新对话历史显示
        updateChatHistoryDisplay(moduleType, emissionType);
    }
}

// 保存AI对话记录
function saveAIChatHistory(moduleType, emissionType, question, answer) {
    if (!aiChatHistory[moduleType]) {
        aiChatHistory[moduleType] = [];
    }
    
    aiChatHistory[moduleType].push({
        emissionType: emissionType,
        question: question,
        answer: answer,
        timestamp: new Date().toLocaleString()
    });
}

// 更新对话历史显示
function updateChatHistoryDisplay(moduleType, emissionType) {
    const historyMessages = document.getElementById('historyMessages');
    if (historyMessages) {
        historyMessages.innerHTML = renderChatHistory(moduleType, emissionType);
    }
}

// 继续对话功能
function continueConversation() {
    document.getElementById('aiQuestion').value = '';
    document.getElementById('aiQuestion').focus();
    document.getElementById('aiResponse').style.display = 'none';
}

// 改进3: 重新设计Lean优化逻辑
// 将原有的openAIModal函数替换为openEnhancedAIModal
function openAIModal(emissionType, emissionData) {
    // 根据当前模块确定类型
    const currentModule = document.querySelector('.nav-tab.active').dataset.module;
    openEnhancedAIModal(emissionType, emissionData, currentModule);
}

// 改进4: 方案优化系统
let optimizationSchemes = [];

// 创建优化方案
function createOptimizationScheme(suggestions) {
    const scheme = {
        id: Date.now(),
        name: `优化方案 ${optimizationSchemes.length + 1}`,
        suggestions: suggestions,
        createdAt: new Date().toLocaleString(),
        status: 'draft', // draft, approved, implemented
        expectedReduction: calculateExpectedReduction(suggestions),
        timelineImpact: calculateTimelineImpact(suggestions)
    };
    
    optimizationSchemes.push(scheme);
    return scheme;
}

// 计算预期减排效果
function calculateExpectedReduction(suggestions) {
    return suggestions.reduce((total, suggestion) => {
        const reduction = parseInt(suggestion.reduction?.replace(/[^\d]/g, '') || '0');
        return total + reduction;
    }, 0);
}

// 计算对时间线的影响
function calculateTimelineImpact(suggestions) {
    const impacts = {
        procurement: 0,
        manufacturing: 0,
        logistics: 0,
        usage: 0,
        recycling: 0,
        decomposition: 0
    };
    
    suggestions.forEach(suggestion => {
        // 根据建议类型计算对各阶段时间线的影响
        if (suggestion.title.includes('供应商') || suggestion.title.includes('采购')) {
            impacts.procurement = Math.floor(Math.random() * 10) - 5; // -5到+5天的影响
        }
        if (suggestion.title.includes('生产') || suggestion.title.includes('工艺')) {
            impacts.manufacturing = Math.floor(Math.random() * 15) - 7; // -7到+8天的影响
        }
        // 其他类似逻辑...
    });
    
    return impacts;
}

// 应用优化方案到时间线
function applySchemeToTimeline(scheme) {
    if (!analysisData || !analysisData.timeline) return;
    
    const impacts = scheme.timelineImpact;
    const newTimeline = { ...analysisData.timeline };
    
    // 应用影响到时间线
    Object.keys(impacts).forEach(phase => {
        if (newTimeline[phase] && impacts[phase] !== 0) {
            const currentDuration = newTimeline[phase].duration;
            const newDuration = Math.max(1, currentDuration + impacts[phase]);
            newTimeline[phase] = {
                ...newTimeline[phase],
                duration: newDuration,
                modified: true,
                originalDuration: currentDuration
            };
        }
    });
    
    return newTimeline;
}

// 显示方案对比
function showSchemeComparison(originalTimeline, optimizedTimeline) {
    const comparisonHtml = `
        <div class="scheme-comparison">
            <h4><i class="fas fa-balance-scale"></i> 方案对比</h4>
            <div class="comparison-grid">
                <div class="original-scheme">
                    <h5>原始承诺时间线</h5>
                    ${renderTimelineComparison(originalTimeline, 'original')}
                </div>
                <div class="optimized-scheme">
                    <h5>优化后预期时间线</h5>
                    ${renderTimelineComparison(optimizedTimeline, 'optimized')}
                </div>
            </div>
        </div>
    `;
    
    return comparisonHtml;
}

// 渲染时间线对比
function renderTimelineComparison(timeline, type) {
    const phases = ['purchase', 'produce', 'use', 'recycle', 'decompose'];
    const phaseNames = {
        purchase: '采购',
        produce: '生产', 
        use: '使用',
        recycle: '回收',
        decompose: '降解'
    };
    
    return phases.map(phase => {
        const data = timeline[phase];
        const isModified = data?.modified;
        const changeClass = isModified ? (data.duration < data.originalDuration ? 'improved' : 'extended') : '';
        
        return `
            <div class="timeline-item ${changeClass}">
                <span class="phase-name">${phaseNames[phase]}</span>
                <span class="duration">${data?.duration}${data?.unit || '天'}</span>
                ${isModified ? `<span class="change-indicator">${data.duration - data.originalDuration > 0 ? '+' : ''}${data.duration - data.originalDuration}</span>` : ''}
            </div>
        `;
    }).join('');
}

console.log('碳排放管理系统改进功能已加载');
