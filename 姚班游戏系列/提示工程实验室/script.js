// 游戏状态
const game = {
    currentLevel: 1,
    completedLevels: [],
    currentTask: null
};

// 关卡任务
const levels = {
    1: {
        title: "基础提示 - 文本摘要",
        desc: "编写一个提示词，让AI总结一篇文章的要点",
        goal: "目标：生成简洁的3点摘要",
        input: "人工智能正在改变我们的生活。从智能手机到自动驾驶，AI技术无处不在。它帮助医生诊断疾病，帮助科学家发现新药，也让我们的日常生活更加便利。",
        keywords: ["总结", "摘要", "要点", "3点"],
        minScore: 70
    },
    2: {
        title: "角色扮演 - 专家咨询",
        desc: "让AI扮演一位资深的Python程序员，解答技术问题",
        goal: "目标：获得专业且详细的技术建议",
        input: "如何优化Python代码的性能？",
        keywords: ["角色", "专家", "Python", "程序员"],
        minScore: 75
    },
    3: {
        title: "Few-Shot学习 - 情感分类",
        desc: "提供2-3个示例，让AI学会分类文本的情感",
        goal: "目标：正确分类新文本的情感（正面/负面）",
        input: "这个产品质量太差了，完全不值这个价格。",
        keywords: ["示例", "例子", "正面", "负面"],
        minScore: 80
    },
    4: {
        title: "思维链 - 数学推理",
        desc: "引导AI展示解题的推理步骤",
        goal: "目标：获得带有详细推理过程的答案",
        input: "一个班级有30个学生，其中60%是女生，女生中有一半戴眼镜。戴眼镜的女生有多少人？",
        keywords: ["步骤", "推理", "思考", "过程"],
        minScore: 85
    },
    5: {
        title: "工具使用 - Function Calling",
        desc: "设计提示词让AI知道何时调用外部工具",
        goal: "目标：AI能识别需要调用天气查询工具",
        input: "明天北京的天气怎么样？",
        keywords: ["工具", "函数", "调用", "天气"],
        minScore: 80
    }
};

// 提示词模板
const templates = {
    basic: `请帮我完成以下任务：
[在这里描述任务]

要求：
- [要求1]
- [要求2]`,
    
    role: `你是一位[角色描述]，拥有[专业领域]的丰富经验。

请以专业的角度回答以下问题：
[问题内容]

请确保回答：
- 专业准确
- 通俗易懂
- 有实际案例`,
    
    fewshot: `请根据以下示例学习模式，然后处理新的输入。

示例1：
输入：[示例输入1]
输出：[示例输出1]

示例2：
输入：[示例输入2]
输出：[示例输出2]

现在请处理：
输入：[新输入]
输出：`,
    
    cot: `请一步步思考并解决以下问题：

问题：[问题描述]

请按照以下步骤：
1. 理解问题
2. 分析已知条件
3. 推理过程
4. 得出结论

让我们开始：`
};

// 初始化
function init() {
    // 关卡按钮
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const level = parseInt(btn.dataset.level);
            loadLevel(level);
        });
    });
    
    // 模板按钮
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            loadTemplate(btn.dataset.template);
        });
    });
    
    // 工具按钮
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            insertTool(btn.dataset.tool);
        });
    });
    
    // 提交按钮
    document.getElementById('submitBtn').addEventListener('click', submitPrompt);
    
    // 输入监听
    document.getElementById('promptInput').addEventListener('input', updateStats);
    
    // 加载第一关
    loadLevel(1);
}

function loadLevel(level) {
    game.currentLevel = level;
    game.currentTask = levels[level];
    
    // 更新按钮状态
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnLevel = parseInt(btn.dataset.level);
        if (btnLevel === level) {
            btn.classList.add('active');
        }
        if (game.completedLevels.includes(btnLevel)) {
            btn.classList.add('completed');
        }
    });
    
    // 更新任务卡片
    const task = game.currentTask;
    document.querySelector('.task-title').textContent = task.title;
    document.querySelector('.task-desc').textContent = task.desc;
    document.querySelector('.task-goal').textContent = task.goal;
    
    // 清空输入和输出
    document.getElementById('promptInput').value = '';
    document.getElementById('responseBox').textContent = '提交提示词后查看AI响应...';
    document.getElementById('evaluation').classList.remove('show');
    
    // 重置评分
    resetScores();
}

function loadTemplate(templateName) {
    const template = templates[templateName];
    document.getElementById('promptInput').value = template;
    updateStats();
}

function insertTool(tool) {
    const textarea = document.getElementById('promptInput');
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    
    let insertion = '';
    switch(tool) {
        case 'role':
            insertion = '\n你是一位[角色描述]。\n';
            break;
        case 'context':
            insertion = '\n背景信息：[添加上下文]\n';
            break;
        case 'example':
            insertion = '\n示例：\n输入：[示例输入]\n输出：[示例输出]\n';
            break;
        case 'constraint':
            insertion = '\n要求：\n- [约束条件1]\n- [约束条件2]\n';
            break;
    }
    
    textarea.value = textBefore + insertion + textAfter;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = cursorPos + insertion.length;
    updateStats();
}

function updateStats() {
    const text = document.getElementById('promptInput').value;
    const charCount = text.length;
    const tokenCount = Math.ceil(charCount / 4); // 粗略估算
    
    document.getElementById('charCount').textContent = charCount;
    document.getElementById('tokenCount').textContent = tokenCount;
}

function submitPrompt() {
    const prompt = document.getElementById('promptInput').value.trim();
    
    if (!prompt) {
        alert('请先编写提示词！');
        return;
    }
    
    // 模拟AI响应
    const response = generateResponse(prompt);
    document.getElementById('responseBox').textContent = response;
    
    // 评估提示词质量
    const scores = evaluatePrompt(prompt);
    displayEvaluation(scores);
}

function generateResponse(prompt) {
    const task = game.currentTask;
    const level = game.currentLevel;
    
    // 根据关卡生成不同的响应
    const responses = {
        1: "文章要点总结：\n1. 人工智能技术正在广泛应用于日常生活\n2. AI在医疗和科研领域发挥重要作用\n3. AI技术提升了生活便利性",
        2: "作为一名资深Python程序员，我建议从以下几个方面优化性能：\n1. 使用内置函数和库（如NumPy）\n2. 避免不必要的循环，使用列表推导式\n3. 使用生成器处理大数据\n4. 考虑使用Cython或PyPy\n5. 进行性能分析找出瓶颈",
        3: "根据提供的示例，这段文本的情感分类为：负面\n\n理由：文本中包含"质量太差"、"完全不值"等负面词汇，表达了强烈的不满情绪。",
        4: "让我一步步解决这个问题：\n\n第1步：理解问题\n- 总学生数：30人\n- 女生比例：60%\n- 戴眼镜的女生比例：50%\n\n第2步：计算女生人数\n女生人数 = 30 × 60% = 18人\n\n第3步：计算戴眼镜的女生\n戴眼镜的女生 = 18 × 50% = 9人\n\n答案：戴眼镜的女生有9人。",
        5: "我需要查询天气信息。让我调用天气查询工具：\n\nfunction_call: get_weather\nparameters: {\n  location: \"北京\",\n  date: \"明天\"\n}\n\n根据查询结果，我会为您提供明天北京的详细天气信息。"
    };
    
    return responses[level] || "这是AI的响应内容...";
}

function evaluatePrompt(prompt) {
    const task = game.currentTask;
    const promptLower = prompt.toLowerCase();
    
    // 准确性：检查是否包含关键词
    let accuracy = 0;
    task.keywords.forEach(keyword => {
        if (promptLower.includes(keyword.toLowerCase())) {
            accuracy += 100 / task.keywords.length;
        }
    });
    
    // 完整性：检查提示词长度和结构
    let completeness = 0;
    if (prompt.length > 50) completeness += 30;
    if (prompt.length > 100) completeness += 30;
    if (prompt.includes('\n')) completeness += 20; // 有结构
    if (prompt.includes('：') || prompt.includes(':')) completeness += 20; // 有标签
    
    // 效率：token数量（越少越好，但不能太少）
    const tokenCount = Math.ceil(prompt.length / 4);
    let efficiency = 100;
    if (tokenCount > 200) efficiency = Math.max(50, 100 - (tokenCount - 200) / 5);
    if (tokenCount < 20) efficiency = tokenCount * 5;
    
    return {
        accuracy: Math.min(100, Math.round(accuracy)),
        completeness: Math.min(100, Math.round(completeness)),
        efficiency: Math.min(100, Math.round(efficiency))
    };
}

function displayEvaluation(scores) {
    const total = Math.round((scores.accuracy + scores.completeness + scores.efficiency) / 3);
    
    // 更新进度条
    document.getElementById('accuracy').style.width = scores.accuracy + '%';
    document.getElementById('completeness').style.width = scores.completeness + '%';
    document.getElementById('efficiency').style.width = scores.efficiency + '%';
    document.getElementById('totalScore').textContent = total;
    
    // 显示评价
    const evaluation = document.getElementById('evaluation');
    let feedback = '';
    
    if (total >= 90) {
        feedback = '🎉 优秀！这是一个高质量的提示词！';
    } else if (total >= 75) {
        feedback = '👍 不错！提示词质量良好，还有提升空间。';
    } else if (total >= 60) {
        feedback = '💡 还可以！建议添加更多细节和约束条件。';
    } else {
        feedback = '📝 需要改进。提示词应该更具体、更有结构。';
    }
    
    evaluation.textContent = feedback;
    evaluation.classList.add('show');
    
    // 检查是否通关
    if (total >= game.currentTask.minScore) {
        if (!game.completedLevels.includes(game.currentLevel)) {
            game.completedLevels.push(game.currentLevel);
            setTimeout(() => {
                alert(`🎊 恭喜通关！\n\n你已掌握：${game.currentTask.title}\n\n总分：${total}/100`);
            }, 500);
        }
    }
}

function resetScores() {
    document.getElementById('accuracy').style.width = '0%';
    document.getElementById('completeness').style.width = '0%';
    document.getElementById('efficiency').style.width = '0%';
    document.getElementById('totalScore').textContent = '0';
}

// 启动游戏
window.addEventListener('load', init);
