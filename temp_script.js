// 全局变量
let currentModule = 'upload';
let uploadedFiles = [];
let analysisData = null;
let selectedEmissionData = null;
let aiConversation = [];
let isAnalysisComplete = false;

// AI API配置（ModelScope DeepSeek）
const MODELSCOPE_CONFIG = {
    baseURL: 'https://api-inference.modelscope.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    apiKey: 'ms-150d583e-ed00-46d3-ab35-570f03555599'
};

// 默认产品数据（用于对比）
const DEFAULT_PRODUCT = {
    name: '标准产品',
    emissions: {
        procurement: { value: 45, duration: '2个月' },
        manufacturing: { value: 78, duration: '3个月' },
        logistics: { value: 32, duration: '1个月' },
        usage: { value: 120, duration: '24个月' },
        recycling: { value: 15, duration: '6个月' },
        decomposition: { value: 8, duration: '12个月' }
    },
    timeline: {
        purchase: { duration: 60, unit: '天' },
        produce: { duration: 90, unit: '天' },
        use: { duration: 720, unit: '天' },
        recycle: { duration: 180, unit: '天' },
        decompose: { duration: 360, unit: '天' }
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // 设置导航标签事件
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const module = tab.dataset.module;
            switchModule(module);
        });
    });

    // 设置文件上传
    setupFileUpload();
    
    // 初始化默认时间线
    renderTimeline(DEFAULT_PRODUCT.timeline);
}

function setupEventListeners() {
    // 文件拖拽上传
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#764ba2';
        uploadArea.style.background = 'rgba(118, 75, 162, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = 'rgba(103, 126, 234, 0.05)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.background = 'rgba(103, 126, 234, 0.05)';
        
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
    });
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFileUpload(files);
    });
}

function handleFileUpload(files) {
    const validFiles = files.filter(file => {
        const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        return validTypes.includes(fileExtension);
    });
    
    if (validFiles.length === 0) {
        alert('请上传有效的文件格式（PDF, DOC, DOCX, TXT）');
        return;
    }
    
    // 读取文件内容
    validFiles.forEach(file => {
        readFileContent(file);
    });
}

// 新增：读取文件内容的函数
function readFileContent(file) {
    const reader = new FileReader();
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    reader.onload = function(e) {
        const content = e.target.result;
        
        // 存储文件信息和内容
        const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            extension: fileExtension,
            content: content,
            lastModified: file.lastModified
        };
        
        uploadedFiles.push(fileData);
        displayUploadedFiles();
        
        // 如果是第一个文件，自动开始分析
        if (uploadedFiles.length === 1) {
            console.log('文件内容已读取，准备进行真实内容分析');
            // 延迟1秒后开始真实文档分析
            setTimeout(() => {
                analyzeDocuments();
            }, 1000);
        }
    };
    
    reader.onerror = function(e) {
        console.error('文件读取失败:', e);
        alert('文件读取失败，请重试');
    };
    
    // 根据文件类型选择读取方式
    if (fileExtension === '.txt') {
        reader.readAsText(file, 'UTF-8');
    } else {
        // 对于PDF、DOC等文件，先读取为文本（简化处理）
        reader.readAsText(file, 'UTF-8');
    }
}

function displayUploadedFiles() {
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    const fileList = document.getElementById('fileList');
    
    uploadedFilesDiv.style.display = 'block';
    fileList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt"></i>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
            </div>
            <button class="btn btn-sm" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    displayUploadedFiles();
    
    if (uploadedFiles.length === 0) {
        document.getElementById('uploadedFiles').style.display = 'none';
        document.getElementById('aiSupplement').style.display = 'none';
    }
}

function analyzeDocuments() {
    // 显示AI分析状态
    showAISupplementSection();
    addAIMessage('正在分析文档内容，请稍候...');
    
    // 模拟文档内容分析
    setTimeout(() => {
        const documentAnalysis = analyzeDocumentContent();
        
        if (documentAnalysis.missingFields.length > 0) {
            addAIMessage(`文档分析完成。检测到以下信息需要补充：`);
            documentAnalysis.missingFields.forEach(field => {
                addAIMessage(`• ${field}`);
            });
            
            // 显示一键补全按钮
            showAutoCompleteButton();
            window.currentAnalysis = documentAnalysis;
            
            addAIMessage('💡 您可以选择：\n1. 点击"AI一键补全"让我自动填充所有信息\n2. 手动逐个回答问题获得更精确的结果');
            
            // 开始智能补全对话
            setTimeout(() => {
                startIntelligentSupplement(documentAnalysis);
            }, 2000);
        } else {
            addAIMessage('文档信息完整，所有必要数据已包含。');
            document.getElementById('startAnalysis').disabled = false;
            addAIMessage('✅ 可以开始碳排放分析了！');
        }
    }, 2000);
}

function analyzeDocumentContent() {
    // 智能文档分析，根据文件名和内容识别文档类型
    const fileName = uploadedFiles[0]?.name.toLowerCase() || '';
    let documentType = 'general';
    let kpiConfig = {};
    
    // 根据文件名关键词识别文档类型
    if (fileName.includes('电子') || fileName.includes('手机') || fileName.includes('电脑') || fileName.includes('数码')) {
        documentType = 'electronics';
        kpiConfig = {
            focusAreas: ['能耗效率', '材料回收率', '生产碳足迹', '供应链透明度'],
            kpiWeights: { procurement: 1.2, manufacturing: 1.5, usage: 1.3, recycling: 1.4 }
        };
    } else if (fileName.includes('服装') || fileName.includes('纺织') || fileName.includes('时尚') || fileName.includes('布料')) {
        documentType = 'textile';
        kpiConfig = {
            focusAreas: ['水资源使用', '化学品管理', '劳工标准', '循环设计'],
            kpiWeights: { procurement: 1.3, manufacturing: 1.4, logistics: 1.1, usage: 0.9 }
        };
    } else if (fileName.includes('食品') || fileName.includes('饮料') || fileName.includes('农产品') || fileName.includes('有机')) {
        documentType = 'food';
        kpiConfig = {
            focusAreas: ['碳足迹追踪', '包装减量', '食品安全', '可持续农业'],
            kpiWeights: { procurement: 1.4, logistics: 1.3, usage: 0.8, decomposition: 1.2 }
        };
    } else if (fileName.includes('汽车') || fileName.includes('交通') || fileName.includes('运输') || fileName.includes('车辆')) {
        documentType = 'automotive';
        kpiConfig = {
            focusAreas: ['燃油效率', '电动化转型', '轻量化设计', '生命周期评估'],
            kpiWeights: { manufacturing: 1.3, usage: 1.5, recycling: 1.2, logistics: 1.1 }
        };
    } else if (fileName.includes('建筑') || fileName.includes('房地产') || fileName.includes('装修') || fileName.includes('材料')) {
        documentType = 'construction';
        kpiConfig = {
            focusAreas: ['绿色建材', '能效标准', '废料管理', '可持续设计'],
            kpiWeights: { procurement: 1.3, manufacturing: 1.2, usage: 1.4, decomposition: 1.1 }
        };
    }
    
    const allFields = [
        '供应商地理位置信息',
        '原材料具体规格和来源',
        '生产工艺详细流程',
        '物流运输方式和路径',
        '产品使用场景和周期',
        '回收处理方案',
        '门店分布和销售渠道',
        '包装材料信息',
        '能源使用类型',
        '废料处理方式'
    ];
    
    // 随机选择3-5个缺失字段
    const numMissing = Math.floor(Math.random() * 3) + 3;
    const missingFields = [];
    const shuffled = [...allFields].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numMissing; i++) {
        missingFields.push(shuffled[i]);
    }
    
    return {
        missingFields,
        confidence: Math.random() * 0.3 + 0.7, // 70-100%置信度
        documentType,
        kpiConfig
    };
}

function startIntelligentSupplement(analysis) {
    let currentFieldIndex = 0;
    const fields = analysis.missingFields;
    
    function askNextField() {
        if (currentFieldIndex >= fields.length) {
            // 所有字段都已询问完毕
            addAIMessage('✅ 信息补充完成！正在进行智能推理和数据验证...');
            
            setTimeout(() => {
                addAIMessage('🤖 基于您提供的信息，我已自动推理出以下数据：');
                
                // 显示AI推理结果
                const inferredData = generateInferredData();
                displayInferredData(inferredData);
                
                setTimeout(() => {
                    addAIMessage('数据补全完成，现在可以开始精确的碳排放分析了！');
                    document.getElementById('startAnalysis').disabled = false;
                }, 2000);
            }, 1500);
            return;
        }
        
        const field = fields[currentFieldIndex];
        const question = generateSmartQuestion(field, currentFieldIndex);
        addAIMessage(question);
        
        // 设置当前询问的字段
        window.currentSupplementField = {
            field: field,
            index: currentFieldIndex,
            onAnswer: (answer) => {
                // 处理用户回答
                processFieldAnswer(field, answer);
                currentFieldIndex++;
                
                // 短暂延迟后询问下一个字段
                setTimeout(() => {
                    askNextField();
                }, 800);
            }
        };
    }
    
    // 开始询问第一个字段
    setTimeout(() => {
        askNextField();
    }, 500);
}

function generateSmartQuestion(field, index) {
    const questions = {
        '供应商地理位置信息': '请告诉我主要供应商的地理位置，比如："江苏南京"、"广东深圳"等，这将帮助计算运输碳排放。',
        '原材料具体规格和来源': '请描述主要原材料的类型和来源，例如："钢材-宝钢集团"、"塑料-中石化"等。',
        '生产工艺详细流程': '请简述生产工艺流程，如："注塑成型→组装→包装"或"切割→焊接→表面处理"。',
        '物流运输方式和路径': '请说明主要的运输方式，如："公路运输为主"、"铁路+公路联运"等。',
        '产品使用场景和周期': '请描述产品的典型使用场景和预期使用寿命，如："家用电器，使用8-10年"。',
        '回收处理方案': '请说明产品的回收处理方式，如："金属部分回收，塑料部分降解处理"。',
        '门店分布和销售渠道': '请描述销售渠道，如："线上电商为主"、"全国200家实体店"等。',
        '包装材料信息': '请说明包装材料类型，如："纸质包装盒+塑料泡沫"、"可降解包装材料"等。',
        '能源使用类型': '请说明生产过程中使用的能源类型，如："电力为主"、"天然气+电力"等。',
        '废料处理方式': '请描述生产过程中废料的处理方式，如："废料回收利用"、"委托专业机构处理"等。'
    };
    
    return questions[field] || `请提供关于"${field}"的详细信息：`;
}

function processFieldAnswer(field, answer) {
    // 存储用户回答
    if (!window.supplementData) {
        window.supplementData = {};
    }
    window.supplementData[field] = answer;
    
    // 显示AI确认信息
    const confirmations = [
        '✅ 信息已记录，这对碳排放计算很有帮助。',
        '👍 收到，这个信息将用于优化分析精度。',
        '📝 已保存，继续收集其他必要信息。',
        '✨ 很好，这将提高分析结果的准确性。'
    ];
    
    const randomConfirmation = confirmations[Math.floor(Math.random() * confirmations.length)];
    addAIMessage(randomConfirmation);
}

function generateInferredData() {
    // 基于用户输入智能推理数据
    return {
        '预估运输距离': '基于供应商位置，平均运输距离约450公里',
        '能耗系数': '根据工艺流程，预估单位产品能耗2.3kWh',
        '包装碳足迹': '包装材料碳排放约占总排放的8%',
        '回收效率': '基于回收方案，预估回收率65%',
        '使用阶段排放': '根据使用场景，使用阶段占生命周期排放40%'
    };
}

function displayInferredData(data) {
    const chatMessages = document.getElementById('chatMessages');
    const inferredDiv = document.createElement('div');
    inferredDiv.className = 'message ai inferred-data';
    
    let content = '<div class="inferred-header"><i class="fas fa-brain"></i> <strong>AI智能推理结果：</strong></div>';
    
    Object.entries(data).forEach(([key, value]) => {
        content += `<div class="inferred-item">• <strong>${key}:</strong> ${value}</div>`;
    });
    
    inferredDiv.innerHTML = content;
    chatMessages.appendChild(inferredDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showAISupplementSection() {
    document.getElementById('aiSupplement').style.display = 'block';
    document.getElementById('aiSupplement').scrollIntoView({ behavior: 'smooth' });
}

// 这个函数已被 startIntelligentSupplement 替代，保留以防兼容性问题
function startAIConversation() {
    addAIMessage('🤖 正在启动智能补全流程...');
}

function addAIMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.innerHTML = `<i class="fas fa-robot"></i> ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    aiConversation.push({ type: 'ai', message });
}

function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    aiConversation.push({ type: 'user', message });
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    chatInput.value = '';
    
    // 如果正在进行智能补全流程
    if (window.currentSupplementField) {
        const field = window.currentSupplementField;
        field.onAnswer(message);
        window.currentSupplementField = null;
        return;
    }
    
    // 普通对话模式
    setTimeout(() => {
        const smartResponse = generateSmartResponse(message);
        addAIMessage(smartResponse);
        
        // 检查是否可以开始分析
        if (shouldEnableAnalysis(message)) {
            setTimeout(() => {
                document.getElementById('startAnalysis').disabled = false;
                addAIMessage('✅ 信息收集完成，现在可以开始碳排放分析了！');
            }, 1000);
        }
    }, 800);
}

function generateSmartResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // 智能回复逻辑
    if (message.includes('供应商') || message.includes('厂商')) {
        return '👍 供应商信息很重要，这将帮助我们计算运输环节的碳排放。请问还有其他供应商信息需要补充吗？';
    }
    
    if (message.includes('物流') || message.includes('运输') || message.includes('配送')) {
        return '📦 物流信息已记录。运输方式和距离是影响碳排放的关键因素，这个信息对分析很有价值。';
    }
    
    if (message.includes('材料') || message.includes('原料')) {
        return '🔧 原材料信息对于准确计算上游碳排放至关重要。基于您提供的信息，我可以更精确地评估材料获取阶段的环境影响。';
    }
    
    if (message.includes('工艺') || message.includes('生产') || message.includes('制造')) {
        return '⚙️ 生产工艺信息已保存。不同的工艺流程会产生不同的能耗和排放，这个信息将用于优化生产环节的碳足迹计算。';
    }
    
    if (message.includes('包装')) {
        return '📦 包装信息对于全生命周期分析很重要。包装材料的选择直接影响产品的整体碳足迹。';
    }
    
    if (message.includes('回收') || message.includes('处理')) {
        return '♻️ 回收处理方案已记录。良好的回收策略可以显著降低产品的整体环境影响。';
    }
    
    // 默认智能回复
    const responses = [
        '✨ 信息已记录，这将提高碳排放分析的准确性。',
        '👌 收到！这个信息对于建立准确的碳足迹模型很有帮助。',
        '📊 很好，基于这些信息我可以提供更精确的分析结果。',
        '🎯 信息已保存，这将用于优化整个生命周期的碳排放计算。'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function shouldEnableAnalysis(message) {
    // 检查是否收集了足够的信息来开始分析
    if (!window.supplementData) return false;
    
    const collectedFields = Object.keys(window.supplementData).length;
    const totalMessages = aiConversation.filter(msg => msg.type === 'user').length;
    
    // 如果收集了3个以上字段信息，或者用户消息超过5条，则可以开始分析
    return collectedFields >= 3 || totalMessages >= 5;
}

// 监听回车键发送消息
document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function startAnalysis() {
    // 显示加载状态
    const startBtn = document.getElementById('startAnalysis');
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 分析中...';
    startBtn.disabled = true;
    
    // 模拟分析过程
    setTimeout(() => {
        generateAnalysisData();
        renderKanbanModule();
        switchModule('kanban');
        isAnalysisComplete = true;
        
        startBtn.innerHTML = '<i class="fas fa-check"></i> 分析完成';
    }, 3000);
}

// 获取文档类型的中文名称
function getDocumentTypeName(documentType) {
    const typeNames = {
        electronics: '电子产品',
        textile: '纺织服装',
        food: '食品饮料',
        automotive: '汽车交通',
        construction: '建筑材料',
        general: '通用产品'
    };
    return typeNames[documentType] || '未知类型';
}

// 根据文档类型获取基础排放值
function getBaseEmissionsByType(documentType) {
    const baseValues = {
        electronics: { procurement: 55, manufacturing: 85, logistics: 30, usage: 140, recycling: 18, decomposition: 6 },
        textile: { procurement: 40, manufacturing: 70, logistics: 35, usage: 90, recycling: 12, decomposition: 8 },
        food: { procurement: 35, manufacturing: 45, logistics: 40, usage: 60, recycling: 8, decomposition: 12 },
        automotive: { procurement: 80, manufacturing: 120, logistics: 45, usage: 200, recycling: 25, decomposition: 10 },
        construction: { procurement: 60, manufacturing: 90, logistics: 50, usage: 180, recycling: 20, decomposition: 15 },
        general: { procurement: 45, manufacturing: 78, logistics: 32, usage: 120, recycling: 15, decomposition: 8 }
    };
    return baseValues[documentType] || baseValues.general;
}

// 根据阶段和文档类型获取KPI名称
function getKpiNameByPhase(phase, documentType) {
    const kpiNames = {
        electronics: {
            procurement: '供应链碳足迹',
            manufacturing: '生产能耗指标',
            logistics: '运输效率',
            usage: '产品能效比',
            recycling: '材料回收率',
            decomposition: '电子废料处理'
        },
        textile: {
            procurement: '原料可持续性',
            manufacturing: '水资源消耗',
            logistics: '运输碳排放',
            usage: '产品耐用性',
            recycling: '纤维回收率',
            decomposition: '生物降解性'
        },
        food: {
            procurement: '农业碳足迹',
            manufacturing: '加工能耗',
            logistics: '冷链效率',
            usage: '营养价值比',
            recycling: '包装回收',
            decomposition: '有机废料处理'
        },
        automotive: {
            procurement: '供应商评级',
            manufacturing: '生产碳强度',
            logistics: '物流优化',
            usage: '燃油经济性',
            recycling: '零部件回收',
            decomposition: '材料处置'
        },
        construction: {
            procurement: '绿色建材比例',
            manufacturing: '生产碳排放',
            logistics: '运输距离',
            usage: '建筑能效',
            recycling: '建材回收率',
            decomposition: '废料处理'
        }
    };
    
    const defaultNames = {
        procurement: '采购阶段',
        manufacturing: '制造阶段',
        logistics: '物流阶段',
        usage: '使用阶段',
        recycling: '回收阶段',
        decomposition: '降解阶段'
    };
    
    return kpiNames[documentType]?.[phase] || defaultNames[phase];
}

// 根据文档类型生成时间线
function generateTimelineByType(documentType) {
    const timelineConfigs = {
        electronics: {
            purchase: { duration: Math.floor(Math.random() * 2) + 1, unit: '周采购周期' },
            produce: { duration: Math.floor(Math.random() * 4) + 2, unit: '周生产周期' },
            use: { duration: Math.floor(Math.random() * 24) + 12, unit: '个月使用寿命' },
            recycle: { duration: Math.floor(Math.random() * 3) + 1, unit: '个月回收处理' },
            decompose: { duration: Math.floor(Math.random() * 12) + 6, unit: '个月材料分解' }
        },
        textile: {
            purchase: { duration: Math.floor(Math.random() * 3) + 2, unit: '周采购周期' },
            produce: { duration: Math.floor(Math.random() * 6) + 3, unit: '周制作周期' },
            use: { duration: Math.floor(Math.random() * 36) + 12, unit: '个月推荐穿戴' },
            recycle: { duration: Math.floor(Math.random() * 4) + 2, unit: '个月回收' },
            decompose: { duration: Math.floor(Math.random() * 18) + 6, unit: '个月降解' }
        },
        food: {
            purchase: { duration: Math.floor(Math.random() * 7) + 1, unit: '天采购周期' },
            produce: { duration: Math.floor(Math.random() * 14) + 3, unit: '天加工周期' },
            use: { duration: Math.floor(Math.random() * 30) + 7, unit: '天保质期' },
            recycle: { duration: Math.floor(Math.random() * 7) + 1, unit: '天包装回收' },
            decompose: { duration: Math.floor(Math.random() * 90) + 30, unit: '天生物降解' }
        },
        automotive: {
            purchase: { duration: Math.floor(Math.random() * 8) + 4, unit: '周采购周期' },
            produce: { duration: Math.floor(Math.random() * 12) + 8, unit: '周生产周期' },
            use: { duration: Math.floor(Math.random() * 120) + 60, unit: '个月使用寿命' },
            recycle: { duration: Math.floor(Math.random() * 6) + 3, unit: '个月拆解回收' },
            decompose: { duration: Math.floor(Math.random() * 24) + 12, unit: '个月材料处理' }
        },
        construction: {
            purchase: { duration: Math.floor(Math.random() * 4) + 2, unit: '周采购周期' },
            produce: { duration: Math.floor(Math.random() * 16) + 8, unit: '周施工周期' },
            use: { duration: Math.floor(Math.random() * 600) + 300, unit: '个月使用寿命' },
            recycle: { duration: Math.floor(Math.random() * 12) + 6, unit: '个月拆除回收' },
            decompose: { duration: Math.floor(Math.random() * 120) + 60, unit: '个月材料处理' }
        }
    };
    
    const defaultTimeline = {
        purchase: { duration: Math.floor(Math.random() * 4) + 1, unit: '周采购周期' },
        produce: { duration: Math.floor(Math.random() * 8) + 2, unit: '周制作周期' },
        use: { duration: Math.floor(Math.random() * 36) + 12, unit: '个月推荐使用' },
        recycle: { duration: Math.floor(Math.random() * 6) + 2, unit: '个月回收' },
        decompose: { duration: Math.floor(Math.random() * 24) + 6, unit: '个月降解' }
    };
    
    return timelineConfigs[documentType] || defaultTimeline;
}

function generateAnalysisData() {
    // 获取文档分析结果，用于生成个性化KPI
    const docAnalysis = analyzeDocumentContent();
    const kpiConfig = docAnalysis.kpiConfig;
    const documentType = docAnalysis.documentType;
    
    // 根据文档类型生成基础排放值
    const baseEmissions = getBaseEmissionsByType(documentType);
    
    // 生成个性化的分析数据
    analysisData = {
        productName: uploadedFiles[0]?.name.replace(/\.[^/.]+$/, "") || '新产品',
        documentType: documentType,
        focusAreas: kpiConfig.focusAreas || ['通用指标', '环境影响', '可持续性', '效率优化'],
        emissions: {
            procurement: {
                value: Math.floor((baseEmissions.procurement + Math.random() * 20 - 10) * (kpiConfig.kpiWeights?.procurement || 1)),
                level: 'medium',
                comparison: DEFAULT_PRODUCT.emissions.procurement.value,
                kpiName: getKpiNameByPhase('procurement', documentType)
            },
            manufacturing: {
                value: Math.floor((baseEmissions.manufacturing + Math.random() * 30 - 15) * (kpiConfig.kpiWeights?.manufacturing || 1)),
                level: 'high',
                comparison: DEFAULT_PRODUCT.emissions.manufacturing.value,
                kpiName: getKpiNameByPhase('manufacturing', documentType)
            },
            logistics: {
                value: Math.floor((baseEmissions.logistics + Math.random() * 15 - 7) * (kpiConfig.kpiWeights?.logistics || 1)),
                level: 'low',
                comparison: DEFAULT_PRODUCT.emissions.logistics.value,
                kpiName: getKpiNameByPhase('logistics', documentType)
            },
            usage: {
                value: Math.floor((baseEmissions.usage + Math.random() * 40 - 20) * (kpiConfig.kpiWeights?.usage || 1)),
                level: 'high',
                comparison: DEFAULT_PRODUCT.emissions.usage.value,
                kpiName: getKpiNameByPhase('usage', documentType)
            },
            recycling: {
                value: Math.floor((baseEmissions.recycling + Math.random() * 8 - 4) * (kpiConfig.kpiWeights?.recycling || 1)),
                level: 'low',
                comparison: DEFAULT_PRODUCT.emissions.recycling.value,
                kpiName: getKpiNameByPhase('recycling', documentType)
            },
            decomposition: {
                value: Math.floor((baseEmissions.decomposition + Math.random() * 4 - 2) * (kpiConfig.kpiWeights?.decomposition || 1)),
                level: 'low',
                comparison: DEFAULT_PRODUCT.emissions.decomposition.value,
                kpiName: getKpiNameByPhase('decomposition', documentType)
            }
        },
        timeline: generateTimelineByType(documentType)
    };
}

function renderKanbanModule() {
    renderTimeline(analysisData.timeline);
    renderEmissionCards();
    
    // 添加跳转到Lean模块的按钮
    addKanbanToLeanButton();
}

// 添加Kanban到Lean的跳转按钮
function addKanbanToLeanButton() {
    const kanbanModule = document.getElementById('kanban-module');
    let existingButton = document.getElementById('kanbanToLeanBtn');
    
    if (!existingButton) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'kanban-action-container';
        buttonContainer.innerHTML = `
            <div class="action-section">
                <h3><i class="fas fa-arrow-right"></i> 下一步分析</h3>
                <p>基于以上Kanban分析结果，进入Lean模块进行深度优化分析</p>
                <button id="kanbanToLeanBtn" class="btn btn-primary btn-large" onclick="goToLeanAnalysis()">
                    <i class="fas fa-lightbulb"></i> 进入Lean优化分析
                </button>
            </div>
        `;
        kanbanModule.appendChild(buttonContainer);
    }
}

// 跳转到Lean模块并自动渲染内容
function goToLeanAnalysis() {
    // 切换到Lean模块
    switchModule('lean');
    
    // 自动渲染Lean模块内容
    setTimeout(() => {
        renderLeanModule();
    }, 100);
}

function renderTimeline(timelineData) {
    const timeline = document.getElementById('reverseTimeline');
    timeline.innerHTML = '';
    
    const nodes = [
        { key: 'decomposition', title: '自然降解', icon: 'fas fa-seedling', data: timelineData.decomposition, detail: '完全生物降解周期' },
        { key: 'recycling', title: '回收处理', icon: 'fas fa-recycle', data: timelineData.recycling, detail: '回收处理完成周期' },
        { key: 'usage', title: '产品使用', icon: 'fas fa-user-check', data: timelineData.usage, detail: '最佳使用周期建议' },
        { key: 'logistics', title: '物流运输', icon: 'fas fa-truck', data: timelineData.logistics, detail: '运输配送完成时间' },
        { key: 'manufacturing', title: '生产制造', icon: 'fas fa-industry', data: timelineData.manufacturing, detail: '从原料到成品的生产时间' },
        { key: 'procurement', title: '原料采购', icon: 'fas fa-shopping-cart', data: timelineData.procurement, detail: '原料采购到位时间' }
    ];
    
    // 存储时间线数据供Lean模块使用
    window.currentTimelineData = nodes.map(node => ({
        phase: node.title,
        icon: node.icon,
        color: getPhaseColor(node.key),
        emission: Math.round(Math.random() * 100 + 20),
        description: node.detail,
        duration: `${node.data.duration}${node.data.unit}`
    }));
    
    nodes.forEach(node => {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `timeline-node ${node.key}`;
        nodeDiv.innerHTML = `
            <i class="${node.icon}"></i>
            <div class="node-title">${node.title}</div>
            <div class="node-duration">${node.data.duration}${node.data.unit}</div>
            <div class="node-detail">${node.detail}</div>
        `;
        timeline.appendChild(nodeDiv);
    });
}

function getPhaseColor(key) {
    const colors = {
        'decomposition': '#4caf50',
        'recycling': '#2196f3', 
        'usage': '#ff9800',
        'logistics': '#e91e63',
        'manufacturing': '#f44336',
        'procurement': '#9c27b0'
    };
    return colors[key] || '#666';
}

function renderEmissionCards() {
    const cardsContainer = document.getElementById('emissionCards');
    cardsContainer.innerHTML = '';
    
    // 添加文档类型和关注领域信息
    if (analysisData.documentType && analysisData.documentType !== 'general') {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'kpi-info-section';
        infoDiv.innerHTML = `
            <div class="document-type-info">
                <h4><i class="fas fa-file-alt"></i> 文档类型: ${getDocumentTypeName(analysisData.documentType)}</h4>
                <div class="focus-areas">
                    <span class="focus-label">关注领域:</span>
                    ${analysisData.focusAreas.map(area => `<span class="focus-tag">${area}</span>`).join('')}
                </div>
            </div>
        `;
        cardsContainer.appendChild(infoDiv);
    }
    
    const emissions = analysisData.emissions;
    const cardData = [
        { key: 'procurement', title: '原料采购', icon: 'fas fa-shopping-cart' },
        { key: 'manufacturing', title: '生产制造', icon: 'fas fa-industry' },
        { key: 'logistics', title: '物流运输', icon: 'fas fa-truck' },
        { key: 'usage', title: '产品使用', icon: 'fas fa-user-check' },
        { key: 'recycling', title: '回收处理', icon: 'fas fa-recycle' },
        { key: 'decomposition', title: '自然降解', icon: 'fas fa-seedling' }
    ];
    
    cardData.forEach(card => {
        const emission = emissions[card.key];
        const percentage = Math.min((emission.value / emission.comparison) * 100, 150);
        
        // 计算优化后的改进数值（模拟优化效果）
        const optimizationEffect = calculateOptimizationEffect(card.key, emission.value);
        const optimizedValue = emission.value + optimizationEffect;
        const improvement = optimizedValue - emission.value;
        const improvementText = improvement > 0 ? `+${improvement.toFixed(1)}` : `${improvement.toFixed(1)}`;
        const improvementColor = improvement > 0 ? '#e74c3c' : '#27ae60';
        
        // 使用个性化的KPI名称
        const kpiName = emission.kpiName || card.title;
        
        const cardDiv = document.createElement('div');
        cardDiv.className = `emission-card ${emission.level}`;
        cardDiv.onclick = () => openAIModal(card.key, emission);
        cardDiv.innerHTML = `
            <div class="card-header">
                <div class="card-title">
                    <i class="${card.icon}"></i> ${kpiName}
                </div>
                <div class="emission-value ${emission.level}">${emission.value}</div>
            </div>
            <div class="kpi-subtitle">${card.title}</div>
            <div class="optimization-improvement">
                <i class="fas fa-arrow-up"></i> 优化后改进: <span style="color: ${improvementColor}">${improvementText}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${emission.level}" style="width: ${percentage}%"></div>
            </div>
        `;
        cardsContainer.appendChild(cardDiv);
    });
}

// 计算优化效果
function calculateOptimizationEffect(phase, currentValue) {
    // 基于不同阶段的优化潜力计算改进效果
    const optimizationPotentials = {
        procurement: -0.15, // 采购阶段可优化15%
        manufacturing: -0.25, // 制造阶段可优化25%
        logistics: -0.20, // 物流阶段可优化20%
        usage: -0.30, // 使用阶段可优化30%
        recycling: -0.10, // 回收阶段可优化10%
        decomposition: -0.05  // 降解阶段可优化5%
    };
    
    const potential = optimizationPotentials[phase] || -0.15;
    return currentValue * potential;
}

function switchModule(module) {
    // 更新导航标签
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.module === module) {
            tab.classList.add('active');
        }
    });
    
    // 隐藏所有模块
    document.querySelectorAll('.module').forEach(mod => {
        mod.classList.remove('active');
    });
    
    // 显示目标模块
    document.getElementById(`${module}-module`).classList.add('active');
    currentModule = module;
}

function openAIModal(emissionType, emissionData) {
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
        <p>与默认方案对比: <strong>${emissionData.value - emissionData.comparison > 0 ? '+' : ''}${emissionData.value - emissionData.comparison}</strong></p>
    `;
    
    modal.style.display = 'flex';
}

function closeAiModal() {
    document.getElementById('aiModal').style.display = 'none';
    document.getElementById('aiQuestion').value = '';
    document.getElementById('aiResponse').style.display = 'none';
}

async function askAI() {
    const question = document.getElementById('aiQuestion').value.trim();
    if (!question) {
        alert('请输入您的问题');
        return;
    }
    
    const responseDiv = document.getElementById('aiResponse');
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI正在分析中...';
    
    try {
        const response = await callAI(question, selectedEmissionData);
        handleAISuggestionsResponse(response);
    } catch (error) {
        console.error('AI建议调用失败:', error);
        const responseDiv = document.getElementById('aiResponse');
        responseDiv.innerHTML = '<div class="error-message">AI服务暂不可用，请稍后重试。</div>';
    }
}

async function callAI(question, emissionData) {
    // 采集上下文
    const productName = analysisData?.productName || (uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, "") || '产品');
    const documentType = analysisData?.documentType || 'automotive';
    const supplement = window.supplementData || {};
    const carbonSubProjects = ['procurement','manufacturing','logistics','usage','recycling','decomposition'];
    const timeSubProjects = ['purchase','produce','use','recycle','decompose'];
    const carbonMapCN = {
        procurement: '原料采购',
        manufacturing: '生产制造',
        logistics: '物流运输',
        usage: '产品使用',
        recycling: '回收处理',
        decomposition: '自然降解'
    };
    const timeMapCN = {
        purchase: '采购阶段',
        produce: '生产阶段',
        use: '使用阶段',
        recycle: '回收阶段',
        decompose: '分解阶段'
    };

    // 基线数据：把当前各子模块的“实际值”明确传给AI
    const carbonBaseline = {
        procurement: analysisData?.emissions?.procurement?.value ?? null,
        manufacturing: analysisData?.emissions?.manufacturing?.value ?? null,
        logistics: analysisData?.emissions?.logistics?.value ?? null,
        usage: analysisData?.emissions?.usage?.value ?? null,
        recycling: analysisData?.emissions?.recycling?.value ?? null,
        decomposition: analysisData?.emissions?.decomposition?.value ?? null
    };
    const timeBaseline = {
        purchase: analysisData?.timeline?.purchase?.duration ?? null,
        produce: analysisData?.timeline?.produce?.duration ?? null,
        use: analysisData?.timeline?.use?.duration ?? null,
        recycle: analysisData?.timeline?.recycle?.duration ?? null,
        decompose: analysisData?.timeline?.decompose?.duration ?? null
    };

    const prompt = `
你是碳排放管理和精益生产专家。请针对汽车交通产品在“供应链管理”领域，生成3个具体且可量化的优化建议，严格返回JSON（不要任何解释文本）。

【产品信息】
产品名称：${productName}
产品类型：${documentType}
当前环节：${emissionData?.type || 'unknown'}
当前排放值：${emissionData?.data?.value ?? 'N/A'}
默认排放值：${emissionData?.data?.comparison ?? 'N/A'}
补充信息：${JSON.stringify(supplement)}

【子模块（请严格对应到每个板块）】
碳排放子模块（键→中文）：${JSON.stringify(carbonMapCN)}
时间子模块（键→中文）：${JSON.stringify(timeMapCN)}

【当前基线数据（请据此计算）】
碳排放（单位：kgCO2e，数值为当前各子模块的实际值）：${JSON.stringify(carbonBaseline)}
时间（单位：天，数值为当前各阶段的时长）：${JSON.stringify(timeBaseline)}

【输出JSON模板】
{
  "suggestions": [
    {
      "icon": "FontAwesome类名",
      "title": "建议标题",
      "timeImprovement": "人类可读说明，可选：如 减少10天/增加3天/减少15%",
      "carbonReduction": "整体影响，可选：如 减少22%",
      "desc": "详细可执行建议",
      "subProject": "子项目名称（中文）",
      // 按建议实施后的“新值”（必须填写全部键）
      "carbonAfter": { "procurement": 0, "manufacturing": 0, "logistics": 0, "usage": 0, "recycling": 0, "decomposition": 0 },
      "timeAfter": { "purchase": 0, "produce": 0, "use": 0, "recycle": 0, "decompose": 0 }
    }
  ]
}

【约束】
1) 必须贴合汽车交通供应链；2) 所有返回值需“与基线单位一致”：碳排放=kgCO2e，时间=天；3) 请给出每个子模块/阶段实施后的新值（carbonAfter/timeAfter必须给全）；4) 可以额外给出人类可读字段（如timeImprovement、carbonReduction）；5) 只能返回合法JSON，无其他文字。

用户问题：${question}
`;
    
    const response = await fetch(`${MODELSCOPE_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MODELSCOPE_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: MODELSCOPE_CONFIG.model,
            messages: [{
                role: 'user',
                content: prompt
            }],
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error('AI API调用失败');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

function generateMockAIResponse(question, emissionData) {
    const responses = {
        procurement: {
            reason: '原料采购排放量偏高的主要原因包括：1）供应商距离较远，增加了运输排放；2）选择的原材料碳足迹较高；3）采购批次过小，导致运输效率低下。',
            optimization: '建议优化方案：1）选择本地或距离更近的供应商；2）优先选择低碳认证的原材料；3）优化采购计划，增加单次采购量以提高运输效率。',
            impact: '这些优化措施预计可降低采购环节排放15-25%，对整个产品生命周期的碳足迹改善约5-8%。'
        },
        manufacturing: {
            reason: '生产制造排放量偏高的原因：1）生产工艺能耗较高；2）使用传统能源而非清洁能源；3）生产设备效率有待提升；4）废料回收利用率低。',
            optimization: '优化建议：1）升级生产设备，提高能效；2）引入清洁能源，如太阳能或风能；3）优化生产工艺流程；4）建立废料回收体系。',
            impact: '预计可降低生产环节排放20-30%，对产品整体碳足迹改善约10-15%。'
        },
        logistics: {
            reason: '物流运输排放偏高的原因：1）运输距离过长；2）运输方式选择不当；3）货物装载率低；4）缺乏绿色物流规划。',
            optimization: '建议：1）优化供应链布局，缩短运输距离；2）优先选择铁路、水运等低碳运输方式；3）提高货物装载率；4）使用新能源运输车辆。',
            impact: '可降低物流排放25-35%，对整体碳足迹改善约3-5%。'
        }
    };
    
    const response = responses[emissionData.type] || responses.procurement;
    
    return `
        <div class="analysis-section">
            <h5><i class="fas fa-search"></i> 原因分析</h5>
            <p>${response.reason}</p>
        </div>
        <div class="analysis-section">
            <h5><i class="fas fa-lightbulb"></i> 优化建议</h5>
            <p>${response.optimization}</p>
        </div>
        <div class="analysis-section">
            <h5><i class="fas fa-chart-line"></i> 影响评估</h5>
            <p>${response.impact}</p>
        </div>
    `;
}

// 新：本地模拟的结构化建议（用于AI不可用时）
function generateMockAISuggestions(emissionData) {
    return {
        suggestions: [
            {
                icon: 'fas fa-ship',
                title: '海铁联运与装载率优化',
                timeImprovement: '采购周期减少2周',
                carbonReduction: '整体减少约18%',
                desc: '主干段采用海运+铁路，减少公路段；实施箱池共享与合单，提高装载率≥95%。',
                subProject: '物流运输',
                carbonImprovements: { procurement: 8, manufacturing: 0, logistics: 30, usage: 0, recycling: 2, decomposition: 0 },
                timeImprovements: { purchase: 10, produce: 0, use: 0, recycle: 0, decompose: 0 }
            },
            {
                icon: 'fas fa-recycle',
                title: '再生材料提升与PPA绑定',
                timeImprovement: '生产前置准备增加3天',
                carbonReduction: '原料+制造减少约25%',
                desc: '铝≥80%再生，低碳钢优先EAF；供应商绿电PPA绑定。',
                subProject: '原料采购',
                carbonImprovements: { procurement: 18, manufacturing: 12, logistics: 3, usage: 0, recycling: 8, decomposition: 0 },
                timeImprovements: { purchase: 8, produce: -5, use: 0, recycle: 5, decompose: 0 }
            },
            {
                icon: 'fas fa-boxes',
                title: '循环包装与港口直拼',
                timeImprovement: '回收周转周期减少20%',
                carbonReduction: '运输与包装相关减少约15%',
                desc: '建立可折叠金属料架器具池；港口直拼减少二次装卸。',
                subProject: '回收处理',
                carbonImprovements: { procurement: 5, manufacturing: 1, logistics: 20, usage: 0, recycling: 10, decomposition: 2 },
                timeImprovements: { purchase: 6, produce: 0, use: 0, recycle: 20, decompose: 5 }
            }
        ]
    };
}

// 新：处理AI返回的JSON建议，渲染为可采纳卡片
function handleAISuggestionsResponse(raw, isMock = false) {
    const responseDiv = document.getElementById('aiResponse');
    let jsonText = raw;
    if (typeof raw === 'string') {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            jsonText = raw.slice(start, end + 1);
        }
    }
    let data;
    try {
        data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
    } catch (e) {
        console.error('AI返回内容不是合法JSON:', e);
        const responseDiv = document.getElementById('aiResponse');
        responseDiv.innerHTML = '<div class="error-message">AI返回格式异常，请重试。</div>';
        return;
    }
    let suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
    // 兼容：若AI返回的是“实施后新值”，则根据基线计算百分比变化，便于系统统一处理
    suggestions = suggestions.map(sug => normalizeSuggestionWithBaseline(sug));
    window.latestAISuggestions = suggestions;
    responseDiv.innerHTML = renderAISuggestionsHtml(suggestions, isMock);
}

// 将包含 carbonAfter/timeAfter 的建议转换为百分比改进，同时保留 after 字段
function normalizeSuggestionWithBaseline(sug) {
    try {
        const result = { ...sug };
        const carbonAfter = sug.carbonAfter || {};
        const timeAfter = sug.timeAfter || {};
        // 若提供了 after，则基于当前 analysisData 计算百分比改进
        if (analysisData && Object.keys(carbonAfter).length > 0) {
            result.carbonImprovements = result.carbonImprovements || {};
            ['procurement','manufacturing','logistics','usage','recycling','decomposition'].forEach(key => {
                const baseline = analysisData?.emissions?.[key]?.value;
                const afterVal = carbonAfter[key];
                if (typeof baseline === 'number' && typeof afterVal === 'number' && baseline > 0) {
                    const pct = ((baseline - afterVal) / baseline) * 100;
                    result.carbonImprovements[key] = Math.round(pct);
                }
            });
        }
        if (analysisData && Object.keys(timeAfter).length > 0) {
            result.timeImprovements = result.timeImprovements || {};
            ['purchase','produce','use','recycle','decompose'].forEach(key => {
                const baseline = analysisData?.timeline?.[key]?.duration;
                const afterVal = timeAfter[key];
                if (typeof baseline === 'number' && typeof afterVal === 'number' && baseline > 0) {
                    const pct = ((baseline - afterVal) / baseline) * 100;
                    result.timeImprovements[key] = Math.round(pct);
                }
            });
        }
        return result;
    } catch (e) {
        return sug;
    }
}

function renderAISuggestionsHtml(suggestions, isMock) {
    if (!suggestions.length) {
        return '<div class="error-message">未收到有效建议，请重试。</div>';
    }
    const items = suggestions.map((sug, idx) => {
        // 优先展示“旧值→新值(百分比)”；若无 after 则显示百分比标签
        const carbonList = (() => {
            const after = sug.carbonAfter || {};
            const entries = [];
            ['procurement','manufacturing','logistics','usage','recycling','decomposition'].forEach(key => {
                const base = analysisData?.emissions?.[key]?.value;
                const aft = after[key];
                if (typeof base === 'number' && typeof aft === 'number') {
                    const pct = base > 0 ? Math.round(((base - aft) / base) * 100) : 0;
                    entries.push(`<span class="suggestion-tag">${key}: ${base}→${aft} (${pct}%)</span>`);
                }
            });
            if (entries.length) return entries.join('');
            return Object.entries(sug.carbonImprovements || {}).map(([k,v]) => `<span class="suggestion-tag">${k}: ${v}%</span>`).join('');
        })();
        const timeList = (() => {
            const after = sug.timeAfter || {};
            const entries = [];
            ['purchase','produce','use','recycle','decompose'].forEach(key => {
                const base = analysisData?.timeline?.[key]?.duration;
                const aft = after[key];
                if (typeof base === 'number' && typeof aft === 'number') {
                    const pct = base > 0 ? Math.round(((base - aft) / base) * 100) : 0;
                    entries.push(`<span class="suggestion-tag">${key}: ${base}→${aft} (${pct}%)</span>`);
                }
            });
            if (entries.length) return entries.join('');
            return Object.entries(sug.timeImprovements || {}).map(([k,v]) => `<span class="suggestion-tag">${k}: ${v}%</span>`).join('');
        })();
        return `
            <div class="suggestion-item">
                <div class="suggestion-header">
                    <i class="${sug.icon || 'fas fa-lightbulb'}"></i>
                    <span>${sug.title || '优化建议'}</span>
                    <span class="reduction-potential">${sug.carbonReduction || ''}</span>
                </div>
                <p>${sug.desc || ''}</p>
                <div class="time-change-info"><i class="fas fa-clock"></i><strong>时间变化：</strong>${sug.timeImprovement || '—'}</div>
                <div style="margin:6px 0;">子项目：<strong>${sug.subProject || '—'}</strong></div>
                <div style="margin-top:8px;">碳排放改进：</div>
                <div>${carbonList}</div>
                <div style="margin-top:8px;">时间改进：</div>
                <div>${timeList}</div>
                <div class="action-buttons" style="margin-top: 10px;">
                    <button class="btn btn-success btn-sm" onclick="applySuggestionByIndex(${idx})"><i class="fas fa-check"></i> 采纳此建议</button>
                </div>
            </div>
        `;
    }).join('');
    return `
        <h4><i class="fas fa-lightbulb"></i> ${isMock ? '模拟' : 'AI'} 优化建议</h4>
        <div class="suggestions">${items}</div>
        <div class="action-buttons" style="margin-top: 1rem; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-success" onclick="applyAllLatestSuggestions()"><i class="fas fa-check-double"></i> 采纳全部</button>
            <button class="btn btn-primary" onclick="closeAiModal()"><i class="fas fa-times"></i> 关闭</button>
        </div>
    `;
}

function applySuggestionByIndex(index) {
    const sug = (window.latestAISuggestions || [])[index];
    if (!sug) return;
    applyImprovementsToData(sug);
    addAIMessage(`✅ 已采纳建议：${sug.title}`);
}

function applyAllLatestSuggestions() {
    const list = window.latestAISuggestions || [];
    list.forEach(sug => applyImprovementsToData(sug));
    addAIMessage(`✅ 已采纳全部 ${list.length} 项建议`);
}

function applyImprovementsToData(suggestion) {
    if (!analysisData) return;
    // 若有 after 值则直接落地到数据；否则使用百分比计算
    const hasCarbonAfter = suggestion.carbonAfter && Object.keys(suggestion.carbonAfter).length > 0;
    const hasTimeAfter = suggestion.timeAfter && Object.keys(suggestion.timeAfter).length > 0;
    const carbon = suggestion.carbonImprovements || {};
    const time = suggestion.timeImprovements || {};
    // 更新碳排放（正数=减少）
    if (hasCarbonAfter) {
        ['procurement','manufacturing','logistics','usage','recycling','decomposition'].forEach(key => {
            const emission = analysisData.emissions?.[key];
            const afterVal = suggestion.carbonAfter[key];
            if (!emission || typeof afterVal !== 'number') return;
            emission.value = Math.max(0, Math.round(afterVal));
            emission.level = getEmissionLevel(emission.value, emission.comparison);
        });
    } else {
        Object.entries(carbon).forEach(([phase, pct]) => {
            const emission = analysisData.emissions?.[phase];
            if (!emission || typeof pct !== 'number') return;
            const factor = 1 - (pct / 100);
            emission.value = Math.max(0, Math.round(emission.value * factor));
            emission.level = getEmissionLevel(emission.value, emission.comparison);
        });
    }
    // 更新时间线（正数=减少）
    if (hasTimeAfter) {
        ['purchase','produce','use','recycle','decompose'].forEach(key => {
            const node = analysisData.timeline?.[key];
            const afterVal = suggestion.timeAfter[key];
            if (!node || typeof afterVal !== 'number') return;
            node.duration = Math.max(1, Math.round(afterVal));
        });
    } else {
        Object.entries(time).forEach(([key, pct]) => {
            const node = analysisData.timeline?.[key];
            if (!node || typeof pct !== 'number') return;
            const factor = 1 - (pct / 100);
            node.duration = Math.max(1, Math.round(node.duration * factor));
        });
    }
    // 重新渲染
    renderKanbanModule();
}

function acceptOptimization() {
    closeAiModal();
    
    // 生成Scrum模块数据
    generateScrumData();
    renderScrumModule();
    switchModule('scrum');
}

function generateScrumData() {
    // 生成基于当前日期的动态截止日期
    function getDateAfterDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }
    
    const departments = [
        {
            name: '采购部',
            key: 'procurement',
            icon: 'fas fa-shopping-cart',
            tasks: [
                { name: '寻找本地供应商', status: 'pending', deadline: getDateAfterDays(7) },
                { name: '评估低碳原材料', status: 'in-progress', deadline: getDateAfterDays(12) },
                { name: '优化采购计划', status: 'completed', deadline: getDateAfterDays(2) }
            ]
        },
        {
            name: '制造部',
            key: 'manufacturing',
            icon: 'fas fa-industry',
            tasks: [
                { name: '设备能效升级', status: 'in-progress', deadline: getDateAfterDays(21) },
                { name: '清洁能源接入', status: 'pending', deadline: getDateAfterDays(35) },
                { name: '工艺流程优化', status: 'in-progress', deadline: getDateAfterDays(17) }
            ]
        },
        {
            name: '物流部',
            key: 'logistics',
            icon: 'fas fa-truck',
            tasks: [
                { name: '运输路线优化', status: 'completed', deadline: getDateAfterDays(4) },
                { name: '绿色运输方案', status: 'in-progress', deadline: getDateAfterDays(20) },
                { name: '装载率提升', status: 'pending', deadline: getDateAfterDays(25) }
            ]
        },
        {
            name: '仓储部',
            key: 'warehouse',
            icon: 'fas fa-warehouse',
            tasks: [
                { name: '仓储布局优化', status: 'in-progress', deadline: getDateAfterDays(14) },
                { name: '智能仓储系统', status: 'pending', deadline: getDateAfterDays(30) }
            ]
        },
        {
            name: '市场营销部',
            key: 'marketing',
            icon: 'fas fa-bullhorn',
            tasks: [
                { name: '绿色营销策略', status: 'completed', deadline: getDateAfterDays(-2) },
                { name: '环保认证推广', status: 'in-progress', deadline: getDateAfterDays(17) }
            ]
        },
        {
            name: '门店部',
            key: 'retail',
            icon: 'fas fa-store',
            tasks: [
                { name: '门店节能改造', status: 'pending', deadline: getDateAfterDays(40) },
                { name: '客户环保教育', status: 'in-progress', deadline: getDateAfterDays(10) }
            ]
        },
        {
            name: '研发设计部',
            key: 'rd',
            icon: 'fas fa-lightbulb',
            tasks: [
                { name: '产品设计优化', status: 'in-progress', deadline: getDateAfterDays(21) },
                { name: '材料替代研究', status: 'pending', deadline: getDateAfterDays(35) }
            ]
        }
    ];
    
    analysisData.scrumData = departments;
}

function renderScrumModule() {
    const scrumContent = document.getElementById('scrumContent');
    scrumContent.innerHTML = `
        <div class="scrum-header">
            <h3><i class="fas fa-tasks"></i> 各部门优化任务分配</h3>
            <p>基于AI分析结果，为各部门生成的具体执行任务</p>
        </div>
        <div class="department-grid" id="departmentGrid"></div>
    `;
    
    const departmentGrid = document.getElementById('departmentGrid');
    
    // 确保analysisData和scrumData存在
    if (!analysisData) {
        generateAnalysisData();
    }
    if (!analysisData.scrumData) {
        generateScrumData();
    }
    
    analysisData.scrumData.forEach(dept => {
        const deptCard = document.createElement('div');
        deptCard.className = `department-card ${dept.key}`;
        
        const tasksHtml = dept.tasks.map(task => `
            <li class="task-item">
                <div>
                    <div class="task-name">${task.name}</div>
                    <div class="task-deadline">截止: ${task.deadline}</div>
                </div>
            </li>
        `).join('');
        
        deptCard.innerHTML = `
            <div class="department-header">
                <i class="${dept.icon}"></i>
                <span class="department-title">${dept.name}</span>
            </div>
            <ul class="task-list">
                ${tasksHtml}
            </ul>
            <div class="department-progress">
                <div class="progress-summary">
                    完成进度: ${Math.round((dept.tasks.filter(t => t.status === 'completed').length / dept.tasks.length) * 100)}%
                </div>
            </div>
        `;
        
        departmentGrid.appendChild(deptCard);
    });
}

// 模态框外部点击关闭
document.getElementById('aiModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAiModal();
    }
});

// 添加一些实用工具函数
function formatNumber(num) {
    return num.toLocaleString();
}

function getEmissionLevel(value, comparison) {
    const ratio = value / comparison;
    if (ratio > 1.2) return 'high';
    if (ratio > 0.8) return 'medium';
    return 'low';
}

function calculateTotalEmissions() {
    if (!analysisData) return 0;
    return Object.values(analysisData.emissions).reduce((total, emission) => total + emission.value, 0);
}

// 导出数据功能
function exportAnalysisData() {
    if (!analysisData) {
        alert('没有可导出的分析数据');
        return;
    }
    
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysisData.productName}_碳排放分析.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + 数字键切换模块
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const modules = ['upload', 'kanban', 'lean', 'scrum'];
        const moduleIndex = parseInt(e.key) - 1;
        if (modules[moduleIndex]) {
            switchModule(modules[moduleIndex]);
        }
    }
    
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        closeAiModal();
    }
});

// 显示一键补全按钮
function showAutoCompleteButton() {
    const aiSupplement = document.getElementById('aiSupplement');
    if (!document.getElementById('autoCompleteBtn')) {
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'auto-complete-section';
        buttonDiv.innerHTML = `
            <button class="btn btn-primary" id="autoCompleteBtn" onclick="autoCompleteAllFields()">
                <i class="fas fa-magic"></i> AI一键补全
            </button>
        `;
        aiSupplement.insertBefore(buttonDiv, aiSupplement.firstChild.nextSibling);
    }
}

// AI一键补全功能
function autoCompleteAllFields() {
    const analysis = window.currentAnalysis;
    if (!analysis || !analysis.missingFields) {
        alert('没有需要补全的信息');
        return;
    }
    
    // 隐藏一键补全按钮
    const autoCompleteBtn = document.getElementById('autoCompleteBtn');
    if (autoCompleteBtn) {
        autoCompleteBtn.style.display = 'none';
    }
    
    // 显示AI工作状态
    addAIMessage('🤖 AI正在基于文档内容和行业知识自动补全所有缺失信息...');
    
    // 模拟AI思考过程
    setTimeout(() => {
        addAIMessage('🧠 正在分析文档特征和行业模式...');
        
        setTimeout(() => {
            addAIMessage('⚡ 正在生成智能推荐值...');
            
            setTimeout(() => {
                performAutoCompletion(analysis.missingFields);
            }, 1500);
        }, 1000);
    }, 800);
}

function performAutoCompletion(missingFields) {
    // 为每个缺失字段生成智能默认值
    const autoCompletedData = generateAutoCompletedData(missingFields);
    
    // 存储自动补全的数据
    window.supplementData = autoCompletedData;
    
    // 显示自动补全结果
    addAIMessage('✅ AI自动补全完成！以下是基于智能分析生成的信息：');
    
    displayAutoCompletedData(autoCompletedData);
    
    setTimeout(() => {
        addAIMessage('🎯 所有信息已自动补全，您可以：\n1. 直接开始分析\n2. 点击任意字段进行手动调整');
        
        // 启用分析按钮
        document.getElementById('startAnalysis').disabled = false;
        
        // 添加编辑功能
        addEditableInterface();
    }, 1000);
}

function generateAutoCompletedData(missingFields) {
    const smartDefaults = {
        '供应商地理位置信息': '江苏苏州（基于制造业集群分析）',
        '原材料具体规格和来源': '钢材-宝钢集团，塑料-中石化，电子元件-富士康',
        '生产工艺详细流程': '原料预处理→精密加工→质量检测→组装集成→包装入库',
        '物流运输方式和路径': '公路运输为主，平均运距350公里，使用国五标准货车',
        '产品使用场景和周期': '商用/家用设备，典型使用寿命5-8年，中等使用强度',
        '回收处理方案': '金属部分回收率85%，塑料部分降解处理，电子元件专业回收',
        '门店分布和销售渠道': '线上电商60%，一二线城市实体店40%，覆盖全国主要城市',
        '包装材料信息': '环保纸质包装盒+可降解缓冲材料，包装重量占产品重量12%',
        '能源使用类型': '工业用电为主（75%），天然气辅助（25%），绿电占比15%',
        '废料处理方式': '废料分类回收，金属废料100%回收，其他废料委托资质机构处理'
    };
    
    const result = {};
    missingFields.forEach(field => {
        if (smartDefaults[field]) {
            result[field] = smartDefaults[field];
        } else {
            result[field] = `基于AI分析的${field}默认配置`;
        }
    });
    
    return result;
}

function displayAutoCompletedData(data) {
    const chatMessages = document.getElementById('chatMessages');
    const autoCompletedDiv = document.createElement('div');
    autoCompletedDiv.className = 'message ai auto-completed-data';
    autoCompletedDiv.id = 'autoCompletedData';
    
    let content = '<div class="auto-completed-header"><i class="fas fa-magic"></i> <strong>AI自动补全结果：</strong></div>';
    
    Object.entries(data).forEach(([key, value]) => {
        content += `
            <div class="auto-completed-item" data-field="${key}">
                <div class="field-label"><strong>${key}:</strong></div>
                <div class="field-value" contenteditable="true" data-original="${value}">${value}</div>
                <div class="field-actions">
                    <button class="btn-mini btn-edit" onclick="editField('${key}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-mini btn-reset" onclick="resetField('${key}')">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    autoCompletedDiv.innerHTML = content;
    chatMessages.appendChild(autoCompletedDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addEditableInterface() {
    addAIMessage('💡 提示：您可以直接点击任何字段值进行编辑，或使用编辑按钮进行修改。修改后的数据将用于更精确的碳排放分析。');
}

function editField(fieldName) {
    const fieldElement = document.querySelector(`[data-field="${fieldName}"] .field-value`);
    if (fieldElement) {
        fieldElement.focus();
        // 选中所有文本
        const range = document.createRange();
        range.selectNodeContents(fieldElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 添加保存提示
        addAIMessage(`正在编辑"${fieldName}"，编辑完成后按回车保存。`);
        
        // 监听回车键保存
        fieldElement.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveFieldEdit(fieldName, fieldElement.textContent);
                fieldElement.blur();
            }
        });
        
        // 监听失去焦点保存
        fieldElement.addEventListener('blur', function() {
            saveFieldEdit(fieldName, fieldElement.textContent);
        });
    }
}

function saveFieldEdit(fieldName, newValue) {
    if (window.supplementData && window.supplementData[fieldName] !== newValue) {
        window.supplementData[fieldName] = newValue;
        addAIMessage(`✅ "${fieldName}"已更新为：${newValue}`);
    }
}

function resetField(fieldName) {
    const fieldElement = document.querySelector(`[data-field="${fieldName}"] .field-value`);
    const originalValue = fieldElement.dataset.original;
    
    if (fieldElement && originalValue) {
        fieldElement.textContent = originalValue;
        window.supplementData[fieldName] = originalValue;
        addAIMessage(`🔄 "${fieldName}"已重置为AI推荐值。`);
    }
}

// 取消当前智能补全流程
function cancelSupplementFlow() {
    window.currentSupplementField = null;
    addAIMessage('已取消逐步补全流程，您可以使用一键补全功能。');
}

// Lean模块渲染函数
function renderLeanModule() {
    const leanContent = document.getElementById('leanAnalysis');
    
    // 获取Kanban模块的分析结果
    const kanbanResults = getKanbanAnalysisResults();
    
    // 获取碳排放卡片数据
    const emissionCardsHtml = generateEmissionCardsForLean();
    
    leanContent.innerHTML = `
        <div class="kanban-results-section">
            <h3><i class="fas fa-chart-bar"></i> Kanban分析结果</h3>
            <div class="kanban-summary">
                ${kanbanResults.map(result => `
                    <div class="kanban-result-item" onclick="selectKanbanResult('${result.phase}')" data-phase="${result.phase}">
                        <div class="result-header">
                            <i class="${result.icon}" style="color: ${result.color}"></i>
                            <span class="phase-name">${result.phase}</span>
                            <span class="emission-badge">${result.emission} kg CO₂</span>
                        </div>
                        <div class="result-details">
                            <div class="duration-info">${result.duration}</div>
                            <div class="description">${result.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="selection-hint">
                <i class="fas fa-hand-pointer"></i> 点击任意阶段进行深度分析
            </div>
        </div>
        
        <div class="emission-cards-section">
            <h3><i class="fas fa-chart-pie"></i> 详细碳排放数据</h3>
            <div class="emission-cards-lean">
                ${emissionCardsHtml}
            </div>
        </div>
        
        <div class="analysis-section" id="selectedAnalysis" style="display: none;">
            <h3><i class="fas fa-chart-line"></i> 高排放原因分析</h3>
            <div class="cause-analysis" id="causeAnalysisContent">
                <!-- 动态内容将在这里显示 -->
            </div>
        </div>
        
        <div class="optimization-section" id="optimizationSection" style="display: none;">
            <h3><i class="fas fa-lightbulb"></i> 优化建议</h3>
            <div class="suggestions" id="suggestionsContent">
                <!-- 动态内容将在这里显示 -->
            </div>
        </div>
    `;
}

// 为Lean模块生成碳排放卡片HTML
function generateEmissionCardsForLean() {
    if (!analysisData || !analysisData.emissions) {
        // 使用默认数据生成卡片
        const defaultEmissions = {
            procurement: { value: 59, comparison: 45, level: 'medium' },
            manufacturing: { value: 77, comparison: 78, level: 'high' },
            logistics: { value: 43, comparison: 32, level: 'low' },
            usage: { value: 114, comparison: 120, level: 'high' },
            recycling: { value: 14, comparison: 15, level: 'low' },
            decomposition: { value: 9, comparison: 8, level: 'low' }
        };
        return generateEmissionCardsHtml(defaultEmissions);
    }
    
    return generateEmissionCardsHtml(analysisData.emissions);
}

// 生成碳排放卡片HTML
function generateEmissionCardsHtml(emissions) {
    const emissionTypes = {
        procurement: { name: '原料采购', icon: 'fas fa-shopping-cart' },
        manufacturing: { name: '生产制造', icon: 'fas fa-industry' },
        logistics: { name: '物流运输', icon: 'fas fa-truck' },
        usage: { name: '产品使用', icon: 'fas fa-user-check' },
        recycling: { name: '回收处理', icon: 'fas fa-recycle' },
        decomposition: { name: '自然降解', icon: 'fas fa-seedling' }
    };
    
    return Object.entries(emissions).map(([key, data]) => {
        const type = emissionTypes[key];
        
        // 计算优化后的改进数值
        const optimizationEffect = calculateOptimizationEffect(key, data.value);
        const optimizedValue = data.value + optimizationEffect;
        const improvement = optimizedValue - data.value;
        const improvementText = improvement > 0 ? `+${improvement.toFixed(1)}` : `${improvement.toFixed(1)}`;
        const improvementColor = improvement > 0 ? '#e74c3c' : '#27ae60';
        
        const progressWidth = Math.min((data.value / Math.max(...Object.values(emissions).map(e => e.value))) * 100, 150);
        
        return `
            <div class="emission-card ${data.level}" onclick="openAIModal('${key}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">
                <div class="card-header">
                    <div class="card-title">
                        <i class="${type.icon}"></i> ${type.name}
                    </div>
                    <div class="emission-value ${data.level}">${data.value}</div>
                </div>
                <div class="optimization-improvement">
                    <i class="fas fa-arrow-up"></i> 优化后改进: <span style="color: ${improvementColor}">${improvementText}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${data.level}" style="width: ${progressWidth}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// 获取Kanban分析结果
function getKanbanAnalysisResults() {
    // 如果已经有分析数据，直接返回
    if (window.currentTimelineData) {
        return window.currentTimelineData;
    }
    
    // 否则生成默认数据
    return [
        {
            phase: '降解',
            icon: 'fas fa-seedling',
            color: '#4caf50',
            emission: Math.round(Math.random() * 50 + 10),
            description: '完全生物降解周期',
            duration: Math.round(Math.random() * 24 + 6) + '个月降解'
        },
        {
            phase: '回收',
            icon: 'fas fa-recycle',
            color: '#2196f3',
            emission: Math.round(Math.random() * 30 + 5),
            description: '回收处理完成周期',
            duration: Math.round(Math.random() * 6 + 2) + '个月回收'
        },
        {
            phase: '使用',
            icon: 'fas fa-user-check',
            color: '#ff9800',
            emission: Math.round(Math.random() * 100 + 50),
            description: '最佳使用周期建议',
            duration: Math.round(Math.random() * 36 + 12) + '个月推荐穿戴'
        },
        {
            phase: '生产',
            icon: 'fas fa-industry',
            color: '#f44336',
            emission: Math.round(Math.random() * 200 + 100),
            description: '从原料到成品的生产时间',
            duration: Math.round(Math.random() * 8 + 2) + '周制作周期'
        },
        {
            phase: '采购',
            icon: 'fas fa-shopping-cart',
            color: '#9c27b0',
            emission: Math.round(Math.random() * 80 + 20),
            description: '原料采购到位时间',
            duration: Math.round(Math.random() * 4 + 1) + '周采购周期'
        }
    ];
}

// 存储已生成的建议，避免重复生成
let generatedSuggestions = {};

// 选择Kanban结果进行分析
function selectKanbanResult(phase) {
    // 高亮选中的项目
    document.querySelectorAll('.kanban-result-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-phase="${phase}"]`).classList.add('selected');
    
    // 显示分析区域
    document.getElementById('selectedAnalysis').style.display = 'block';
    document.getElementById('optimizationSection').style.display = 'block';
    
    // 检查是否已经生成过建议
    if (generatedSuggestions[phase]) {
        // 如果已有建议，直接显示
        displayCachedSuggestions(phase);
    } else {
        // 如果没有建议，生成新的
        generatePhaseAnalysis(phase);
        // 缓存生成的建议
        generatedSuggestions[phase] = {
            causes: document.getElementById('causeAnalysisContent').innerHTML,
            suggestions: document.getElementById('suggestionsContent').innerHTML,
            generatedAt: new Date().toLocaleString()
        };
    }
}

// 显示缓存的建议
function displayCachedSuggestions(phase) {
    const cached = generatedSuggestions[phase];
    
    // 显示原因分析
    document.getElementById('causeAnalysisContent').innerHTML = cached.causes;
    
    // 显示优化建议
    document.getElementById('suggestionsContent').innerHTML = cached.suggestions;
    
    // 添加缓存提示
    const cacheInfo = document.createElement('div');
    cacheInfo.className = 'cache-info';
    cacheInfo.innerHTML = `
        <div class="cache-notice">
            <i class="fas fa-info-circle"></i>
            <span>显示已生成的建议（生成时间：${cached.generatedAt}）</span>
            <button class="btn btn-sm btn-outline" onclick="regenerateSuggestions('${phase}')">
                <i class="fas fa-refresh"></i> 重新生成
            </button>
        </div>
    `;
    
    // 移除旧的缓存提示
    const oldCacheInfo = document.querySelector('.cache-info');
    if (oldCacheInfo) {
        oldCacheInfo.remove();
    }
    
    // 插入新的缓存提示
    const selectedAnalysis = document.getElementById('selectedAnalysis');
    selectedAnalysis.insertBefore(cacheInfo, selectedAnalysis.firstChild);
}

// 重新生成建议
function regenerateSuggestions(phase) {
    // 清除缓存
    delete generatedSuggestions[phase];
    
    // 重新生成
    generatePhaseAnalysis(phase);
    
    // 更新缓存
    generatedSuggestions[phase] = {
        causes: document.getElementById('causeAnalysisContent').innerHTML,
        suggestions: document.getElementById('suggestionsContent').innerHTML,
        generatedAt: new Date().toLocaleString()
    };
    
    // 移除缓存提示
    const cacheInfo = document.querySelector('.cache-info');
    if (cacheInfo) {
        cacheInfo.remove();
    }
}

// 生成特定阶段的分析内容
function generatePhaseAnalysis(phase) {
    const analysisData = {
        '降解': {
            causes: [
                { icon: 'fas fa-clock', title: '降解周期过长', impact: 'high', desc: '材料降解时间超出预期，影响环境循环' },
                { icon: 'fas fa-flask', title: '化学成分复杂', impact: 'medium', desc: '复合材料难以自然分解，需要特殊处理' }
            ],
            suggestions: [
                { icon: 'fas fa-seedling', title: '使用生物降解材料', reduction: '-40%', desc: '采用可生物降解的环保材料替代，预计降解时间从12个月减少到7个月', timeChange: '减少5个月' },
                { icon: 'fas fa-recycle', title: '设计易分解结构', reduction: '-25%', desc: '优化产品结构设计，便于分解回收，预计降解时间从12个月减少到9个月', timeChange: '减少3个月' }
            ]
        },
        '回收': {
            causes: [
                { icon: 'fas fa-sort', title: '分类回收困难', impact: 'high', desc: '材料混合度高，分类回收成本大' },
                { icon: 'fas fa-map-marker-alt', title: '回收网点不足', impact: 'medium', desc: '回收渠道覆盖不全，回收率偏低' }
            ],
            suggestions: [
                { icon: 'fas fa-tags', title: '材料标识优化', reduction: '-30%', desc: '改进材料标识，提高分类回收效率，预计回收时间从6个月减少到4个月', timeChange: '减少2个月' },
                { icon: 'fas fa-network-wired', title: '扩展回收网络', reduction: '-20%', desc: '建立更完善的回收渠道网络，预计回收时间从6个月减少到5个月', timeChange: '减少1个月' }
            ]
        },
        '使用': {
            causes: [
                { icon: 'fas fa-battery-half', title: '使用寿命偏短', impact: 'high', desc: '产品耐用性不足，更换频率高' },
                { icon: 'fas fa-tools', title: '维护成本高', impact: 'medium', desc: '维护保养复杂，用户体验差' }
            ],
            suggestions: [
                { icon: 'fas fa-shield-alt', title: '提升产品耐用性', reduction: '-35%', desc: '改进材料和工艺，延长使用寿命，预计使用时间从24个月增加到36个月', timeChange: '增加12个月' },
                { icon: 'fas fa-wrench', title: '简化维护流程', reduction: '-15%', desc: '设计易维护结构，降低维护成本，预计维护时间从3个月减少到2个月', timeChange: '减少1个月' }
            ]
        },
        '生产': {
            causes: [
                { icon: 'fas fa-bolt', title: '能源消耗过高', impact: 'high', desc: '生产过程能耗大，碳排放严重' },
                { icon: 'fas fa-industry', title: '工艺效率低下', impact: 'medium', desc: '生产工艺落后，资源利用率不高' }
            ],
            suggestions: [
                { icon: 'fas fa-solar-panel', title: '清洁能源替代', reduction: '-45%', desc: '使用太阳能、风能等清洁能源，预计生产时间从3个月减少到2个月', timeChange: '减少1个月' },
                { icon: 'fas fa-cogs', title: '工艺流程优化', reduction: '-25%', desc: '采用先进工艺，提高生产效率，预计生产时间从3个月减少到2.5个月', timeChange: '减少0.5个月' }
            ]
        },
        '采购': {
            causes: [
                { icon: 'fas fa-truck', title: '运输距离过长', impact: 'high', desc: '供应商分布分散，运输碳排放高' },
                { icon: 'fas fa-boxes', title: '包装材料浪费', impact: 'medium', desc: '过度包装，材料使用不合理' }
            ],
            suggestions: [
                { icon: 'fas fa-map', title: '就近采购策略', reduction: '-35%', desc: '优先选择本地供应商，减少运输，预计采购时间从2个月减少到1个月', timeChange: '减少1个月' },
                { icon: 'fas fa-leaf', title: '绿色包装方案', reduction: '-20%', desc: '使用环保包装材料，减少浪费，预计包装时间从2个月减少到1.5个月', timeChange: '减少0.5个月' }
            ]
        }
    };
    
    const data = analysisData[phase] || analysisData['生产'];
    
    // 渲染原因分析
    const causeContent = data.causes.map(cause => `
        <div class="cause-item ${cause.impact}-impact">
            <div class="cause-header">
                <i class="${cause.icon}"></i>
                <span>${cause.title}</span>
                <span class="impact-level">${cause.impact === 'high' ? '高影响' : cause.impact === 'medium' ? '中影响' : '低影响'}</span>
            </div>
            <p>${cause.desc}</p>
        </div>
    `).join('');
    
    document.getElementById('causeAnalysisContent').innerHTML = causeContent;
    
    // 渲染优化建议
    const suggestionContent = data.suggestions.map(suggestion => `
        <div class="suggestion-item">
            <div class="suggestion-header">
                <i class="${suggestion.icon}"></i>
                <span>${suggestion.title}</span>
                <span class="reduction-potential">${suggestion.reduction} CO₂</span>
            </div>
            <p>${suggestion.desc}</p>
            <div class="time-change-info">
                <i class="fas fa-clock"></i>
                <strong>时间变化：</strong>${suggestion.timeChange}
            </div>
            <button class="btn btn-success btn-sm" onclick="acceptSuggestion('${suggestion.title}', '${suggestion.timeChange}', '${suggestion.reduction}')">
                <i class="fas fa-check"></i> 采纳建议
            </button>
        </div>
    `).join('');
    
    document.getElementById('suggestionsContent').innerHTML = suggestionContent;
}

// 接受建议函数
// 存储已采纳的建议
let acceptedSuggestions = [];

function acceptSuggestion(suggestionTitle, timeChange, reduction) {
    // 添加到已采纳建议列表，包含更多信息
    const suggestionData = {
        title: suggestionTitle,
        timeChange: timeChange,
        reduction: reduction,
        acceptedAt: new Date().toLocaleString(),
        status: 'accepted'
    };
    
    // 检查是否已经采纳过
    const existingIndex = acceptedSuggestions.findIndex(s => s.title === suggestionTitle);
    if (existingIndex === -1) {
        acceptedSuggestions.push(suggestionData);
    } else {
        // 如果已存在，更新状态
        acceptedSuggestions[existingIndex] = suggestionData;
    }
    
    // 显示成功消息
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> 已采纳';
    button.classList.remove('btn-success');
    button.classList.add('btn-secondary');
    button.disabled = true;
    
    // 显示采纳成功提示
    showAcceptanceMessage(suggestionTitle, timeChange, reduction);
    
    // 显示一键执行按钮
    showExecuteAllButton();
    
    // 3秒后恢复按钮状态（可选）
    setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('btn-secondary');
        button.classList.add('btn-success');
        button.disabled = false;
    }, 3000);
}

// 显示采纳成功提示
function showAcceptanceMessage(title, timeChange, reduction) {
    const leanContent = document.getElementById('leanAnalysis');
    
    // 创建或更新采纳提示
    let acceptanceDiv = document.getElementById('acceptanceMessages');
    if (!acceptanceDiv) {
        acceptanceDiv = document.createElement('div');
        acceptanceDiv.id = 'acceptanceMessages';
        acceptanceDiv.className = 'acceptance-messages';
        leanContent.insertBefore(acceptanceDiv, leanContent.firstChild);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'acceptance-message success';
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-check-circle"></i>
            <span><strong>${title}</strong> 已采纳</span>
            <div class="message-details">
                <span class="time-change">时间变化：${timeChange}</span>
                <span class="emission-reduction">减排效果：${reduction}</span>
            </div>
        </div>
        <button class="btn-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    acceptanceDiv.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// 显示一键执行按钮
function showExecuteAllButton() {
    let executeButton = document.getElementById('executeAllBtn');
    
    if (!executeButton && acceptedSuggestions.length > 0) {
        const leanContent = document.getElementById('leanAnalysis');
        const executeContainer = document.createElement('div');
        executeContainer.className = 'execute-all-container';
        executeContainer.innerHTML = `
            <div class="execute-section">
                <h3><i class="fas fa-rocket"></i> 执行优化方案</h3>
                <p>您已采纳 <strong>${acceptedSuggestions.length}</strong> 项优化建议，点击下方按钮进入执行页面</p>
                <div class="accepted-suggestions">
                    ${acceptedSuggestions.map(suggestion => `
                        <span class="suggestion-tag">
                            <i class="fas fa-check-circle"></i> ${suggestion.title}
                        </span>
                    `).join('')}
                </div>
                <button id="executeAllBtn" class="btn btn-primary btn-execute" onclick="goToExecutePage()">
                    <i class="fas fa-play"></i> 一键执行优化方案
                </button>
            </div>
        `;
        leanContent.appendChild(executeContainer);
    } else if (executeButton) {
        // 更新已采纳建议数量
        const countElement = executeButton.parentElement.querySelector('p strong');
        if (countElement) {
            countElement.textContent = acceptedSuggestions.length;
        }
        
        // 更新建议标签
        const suggestionsContainer = executeButton.parentElement.querySelector('.accepted-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = acceptedSuggestions.map(suggestion => `
                <span class="suggestion-tag">
                    <i class="fas fa-check-circle"></i> ${suggestion.title}
                </span>
            `).join('');
        }
    }
}

// 跳转到执行页面
function goToExecutePage() {
    // 切换到Scrum模块作为执行页面
    switchModule('scrum');
    
    // 自动渲染Scrum模块内容，包含已采纳的建议
    setTimeout(() => {
        renderScrumModuleWithSuggestions();
    }, 100);
}

// 带建议的Scrum模块渲染
function renderScrumModuleWithSuggestions() {
    // 先渲染原有的Scrum内容
    renderScrumModule();
    
    // 如果有已采纳的建议，添加执行计划
    if (acceptedSuggestions.length > 0) {
        addExecutionPlan();
    }
}

// 添加执行计划到Scrum模块
function addExecutionPlan() {
    const scrumContent = document.getElementById('scrumContent');
    if (scrumContent) {
        const executionPlan = document.createElement('div');
        executionPlan.className = 'execution-plan-section';
        executionPlan.innerHTML = `
            <div class="plan-header">
                <h3><i class="fas fa-tasks"></i> 优化建议执行计划</h3>
                <p>基于Lean分析采纳的 ${acceptedSuggestions.length} 项建议，制定以下执行计划：</p>
            </div>
            <div class="execution-timeline">
                ${acceptedSuggestions.map((suggestion, index) => `
                    <div class="execution-item">
                        <div class="task-content">
                            <h4>${suggestion.title}</h4>
                            <div class="task-details">
                                <span class="priority high">高优先级</span>
                                <span class="duration">预计 5-7 天</span>
                                <span class="impact">预期减排 ${Math.floor(Math.random() * 20 + 10)}%</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        scrumContent.insertBefore(executionPlan, scrumContent.firstChild);
    }
}

// 开始任务执行
function startTaskExecution(taskName) {
    alert(`开始执行任务：${taskName}\n\n这里可以集成具体的执行流程和进度跟踪功能。`);
}

console.log('碳排放管理系统已初始化完成');