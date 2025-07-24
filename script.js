document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const modeSwitcher = document.querySelector('.mode-switcher');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const percentInput = document.getElementById('percent-input');
    const fixedInput = document.getElementById('fixed-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsCard = document.getElementById('results-card');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');
    const emptyHistory = document.getElementById('empty-history');
    
    // 输入元素
    const capitalInput = document.getElementById('capital');
    const entryInput = document.getElementById('entry-price');
    const stopInput = document.getElementById('stop-loss');
    const targetInput = document.getElementById('target-price');
    const riskPercentInput = document.getElementById('risk-percent');
    const fixedRiskInput = document.getElementById('fixed-risk');
    
    // 结果元素
    const riskRatioEl = document.getElementById('risk-ratio');
    const rewardRatioEl = document.getElementById('reward-ratio');
    const rrRatioEl = document.getElementById('rr-ratio');
    const positionSharesEl = document.getElementById('position-shares');
    const positionCostEl = document.getElementById('position-cost');
    const positionPercentEl = document.getElementById('position-percent');
    const riskLevelEl = document.getElementById('risk-level');
    const kellyPercentEl = document.getElementById('kelly-percent');
    const progressBar = document.getElementById('position-progress-bar');
    
    // 历史记录数组
    let history = [];
    
    // 从localStorage加载历史记录
    function loadHistory() {
        const savedHistory = localStorage.getItem('positionHistory');
        if (savedHistory) {
            history = JSON.parse(savedHistory);
            renderHistory();
        }
    }
    
    // 保存历史记录到localStorage
    function saveHistory() {
        localStorage.setItem('positionHistory', JSON.stringify(history));
    }
    
    // 渲染历史记录
    function renderHistory() {
        if (history.length === 0) {
            emptyHistory.style.display = 'block';
            historyList.innerHTML = '';
            historyList.appendChild(emptyHistory);
            return;
        }
        
        emptyHistory.style.display = 'none';
        historyList.innerHTML = '';
        
        // 只显示最近10条记录
        const recentHistory = history.slice(0, 10);
        
        recentHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.index = index;
            
            const date = new Date(item.timestamp);
            const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            historyItem.innerHTML = `
                <div class="history-title">
                    <span>仓位计算 #${history.length - index}</span>
                    <span class="history-date">${dateStr}</span>
                </div>
                <div class="history-details">
                    <div class="history-detail">
                        <span>仓位占比:</span>
                        <span>${item.positionPercent}%</span>
                    </div>
                    <div class="history-detail">
                        <span>买入股数:</span>
                        <span>${item.shares.toLocaleString()}</span>
                    </div>
                    <div class="history-detail">
                        <span>占用资金:</span>
                        <span>${formatCurrency(item.cost)}</span>
                    </div>
                    <div class="history-detail">
                        <span>凯利建议:</span>
                        <span>${item.kellyValue}%</span>
                    </div>
                </div>
            `;
            
            historyItem.addEventListener('click', () => {
                restoreHistoryItem(item);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // 恢复历史记录到表单
    function restoreHistoryItem(item) {
        capitalInput.value = item.capital;
        entryInput.value = item.entry;
        stopInput.value = item.stop;
        targetInput.value = item.target;
        
        if (item.mode === 'percent') {
            document.querySelector('.mode-btn[data-mode="percent"]').click();
            riskPercentInput.value = item.riskPercent;
        } else {
            document.querySelector('.mode-btn[data-mode="fixed"]').click();
            fixedRiskInput.value = item.fixedRisk;
        }
        
        calculatePosition();
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // 清除历史记录
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有历史记录吗？')) {
            history = [];
            saveHistory();
            renderHistory();
        }
    });
    
    // 模式切换
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.mode === 'percent') {
                percentInput.style.display = 'block';
                fixedInput.style.display = 'none';
            } else {
                percentInput.style.display = 'none';
                fixedInput.style.display = 'block';
            }
        });
    });
    
    // 计算按钮点击事件 - 添加错误处理
    calculateBtn.addEventListener('click', function() {

        try {
    	calculatePosition();
        } catch (error) {
            console.error('计算出错:', error);
            alert('计算过程中发生错误: ' + error.message);
        }
    });
    
    // 核心计算函数
		function calculatePosition() {
		    // 获取输入值
		    const capital = parseFloat(capitalInput.value);
		    const entry = parseFloat(entryInput.value);
		    const stop = parseFloat(stopInput.value);
		    const target = parseFloat(targetInput.value);
		    const mode = document.querySelector('.mode-btn.active').dataset.mode;
		    
		    // 验证输入
		    if (isNaN(capital) || capital <= 0) {
		        alert('请输入有效的账户总资金（必须大于0）');
		        capitalInput.focus();
		        return;
		    }
		    
		    if (isNaN(entry) || entry <= 0) {
		        alert('请输入有效的当前价格（必须大于0）');
		        entryInput.focus();
		        return;
		    }
		    
		    if (isNaN(stop) || stop <= 0) {
		        alert('请输入有效的止损价格（必须大于0）');
		        stopInput.focus();
		        return;
		    }
		    
		    if (isNaN(target) || target <= 0) {
		        alert('请输入有效的目标价格（必须大于0）');
		        targetInput.focus();
		        return;
		    }
		    
		    if (stop >= entry) {
		        alert('止损价必须小于当前价格');
		        stopInput.focus();
		        return;
		    }
		    
		    if (target <= entry) {
		        alert('目标价格必须大于当前价格');
		        targetInput.focus();
		        return;
		    }
		    
		    // 计算风险比和盈利比
		    const riskRatio = ((entry - stop) / entry * 100).toFixed(2);
		    const rewardRatio = ((target - entry) / entry * 100).toFixed(2);
		    const rrRatio = (rewardRatio / riskRatio).toFixed(2);
		    
		    // 计算凯利值 (40%胜率)
		    const kellyValue = calculateKelly(riskRatio, rewardRatio, 0.4);
		    
		    // 计算建议仓位
		    let positionResult = null;
		    if (mode === 'percent') {
		        const riskPercent = parseFloat(riskPercentInput.value) || 1;
		        if (isNaN(riskPercent) || riskPercent <= 0) {
		            alert('请输入有效的风险比例（必须大于0）');
		            riskPercentInput.focus();
		            return;
		        }
		        positionResult = calculatePercentMode(capital, entry, stop, riskPercent);
		    } else {
		        const fixedRisk = parseFloat(fixedRiskInput.value) || 1000;
		        if (isNaN(fixedRisk) || fixedRisk <= 0) {
		            alert('请输入有效的固定风险金额（必须大于0）');
		            fixedRiskInput.focus();
		            return;
		        }
		        positionResult = calculateFixedMode(entry, stop, fixedRisk);
		    }
		    
		    // 验证计算结果
		    if (!positionResult || isNaN(positionResult.shares) || isNaN(positionResult.cost)) {
		        alert('计算错误：无法确定仓位大小，请检查输入值');
		        return;
		    }
		    
		    // 计算仓位占比
		    let positionPercent = '0';
		    if (capital > 0) {
		        positionPercent = Math.min((positionResult.cost / capital * 100), 100).toFixed(1);
		    }
		    
		    // 更新UI
		    updateResults({
		        riskRatio,
		        rewardRatio,
		        rrRatio,
		        kellyValue,
		        positionResult,
		        positionPercent
		    });
		    
		    // 添加到历史记录
		    addToHistory({
		        capital,
		        entry,
		        stop,
		        target,
		        mode,
		        riskPercent: mode === 'percent' ? parseFloat(riskPercentInput.value) : null,
		        fixedRisk: mode === 'fixed' ? parseFloat(fixedRiskInput.value) : null,
		        shares: positionResult.shares,
		        cost: positionResult.cost,
		        positionPercent,
		        kellyValue,
		        riskRatio,
		        rewardRatio,
		        rrRatio
		    });
		    
		    // 显示结果卡片
		    resultsCard.style.display = 'block';
		    resultsCard.classList.add('fade-in');
		    resultsCard.scrollIntoView({ behavior: 'smooth' });
		}

		// 添加到历史记录
		function addToHistory(data) {
		    // 验证数据
		    if (!data || typeof data !== 'object') {
		        console.error('无效的历史记录数据');
		        return;
		    }

		    // 创建历史记录对象
		    const historyItem = {
		        timestamp: new Date().getTime(),
		        capital: data.capital || 0,
		        entry: data.entry || 0,
		        stop: data.stop || 0,
		        target: data.target || 0,
		        mode: data.mode || 'percent',
		        riskPercent: data.riskPercent || null,
		        fixedRisk: data.fixedRisk || null,
		        shares: data.shares || 0,
		        cost: data.cost || 0,
		        positionPercent: data.positionPercent || '0',
		        kellyValue: data.kellyValue || '0',
		        riskRatio: data.riskRatio || '0',
		        rewardRatio: data.rewardRatio || '0',
		        rrRatio: data.rrRatio || '0'
		    };

		    // 添加到历史记录数组开头
		    history.unshift(historyItem);
		    
		    // 只保留最近10条记录
		    if (history.length > 10) {
		        history.pop();
		    }
		    
		    // 保存并渲染历史记录
		    saveHistory();
		    renderHistory();
		}

    
    // 百分比模式计算
    function calculatePercentMode(capital, entry, stop, riskPercent) {
        const riskAmount = capital * riskPercent / 100;
        const riskPerShare = entry - stop;
        const shares = Math.floor(riskAmount / riskPerShare);
        
        return {
            shares,
            cost: shares * entry,
            riskAmount
        };
    }
    
    // 固定金额模式计算
    function calculateFixedMode(entry, stop, fixedRisk) {
        const riskPerShare = entry - stop;
        const shares = Math.floor(fixedRisk / riskPerShare);
        
        return {
            shares,
            cost: shares * entry,
            actualRisk: shares * riskPerShare
        };
    }
    
    // 凯利公式计算 (40%胜率保守版)
    function calculateKelly(riskRatio, rewardRatio, winRate = 0.4) {
        if (riskRatio <= 0) return 0;
        
        const b = rewardRatio / riskRatio; // 盈亏比
        const p = winRate; // 胜率40%
        
        // 标准凯利公式
        let kelly = (p * (b + 1) - 1) / b;
        
        // 保守处理
        kelly = Math.max(0, kelly); // 不出现负值
        kelly = kelly * 0.8; // 再打8折
        
        return (kelly * 100).toFixed(1);
    }
    
    // 更新结果展示
    function updateResults(data) {
        riskRatioEl.textContent = data.riskRatio + '%';
        rewardRatioEl.textContent = data.rewardRatio + '%';
        rrRatioEl.textContent = data.rrRatio + ':1';
        
        positionSharesEl.textContent = data.positionResult.shares.toLocaleString();
        positionCostEl.textContent = formatCurrency(data.positionResult.cost);
        positionPercentEl.textContent = data.positionPercent + '%';
        kellyPercentEl.textContent = data.kellyValue + '%';
        
        // 更新风险等级和进度条
        updateRiskLevel(data.positionPercent);
        
        // 更新进度条
        const percent = Math.min(parseFloat(data.positionPercent), 30); // 限制最大30%显示
        progressBar.style.width = `${percent * 3.33}%`; // 因为30%对应100%宽度
        
        // 设置进度条颜色
        if (percent < 10) {
            progressBar.className = 'progress-bar progress-low';
        } else if (percent < 20) {
            progressBar.className = 'progress-bar progress-moderate';
        } else {
            progressBar.className = 'progress-bar progress-high';
        }
    }
    
    // 更新风险等级显示
    function updateRiskLevel(percent) {
        let level = 'low';
        let text = '低风险';
        
        if (percent >= 20) {
            level = 'high';
            text = '高风险';
        } else if (percent >= 10) {
            level = 'moderate';
            text = '中风险';
        }
        
        riskLevelEl.className = 'risk-badge risk-' + level;
        riskLevelEl.textContent = text;
    }
    
    // 格式化货币
    function formatCurrency(amount) {
        return amount.toLocaleString('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        });
    }
    
    // 初始化
    function init() {
        loadHistory();
        // 不再自动计算，改为手动点击
    }
    
    // 页面加载完成后初始化
    init();
});