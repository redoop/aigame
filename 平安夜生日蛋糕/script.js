let decorationCount = 0;

function addDecoration(type) {
    const cake = document.getElementById('cake');
    const decoration = document.createElement('div');
    
    if (type === '蜡烛') {
        decoration.className = 'candle';
        decoration.innerHTML = '🕯️';
        decoration.onclick = toggleCandle;
        // 第一次添加蜡烛时显示提示
        if (!document.querySelector('.candle:not(.big-candle)')) {
            showBlowHint();
        }
        // 自动点燃新添加的蜡烛
        setTimeout(() => lightCandle(decoration), 100);
    } else if (type === '黑天鹅') {
        decoration.className = 'swan';
        decoration.innerHTML = '🦢';
        
        // 添加点击事件播放叫声
        decoration.onclick = () => {
            playSwanSound();
            // 添加一个简单的动画效果
            decoration.style.transform = decoration.classList.contains('left') 
                ? 'scaleX(-1) scale(1.2)' 
                : 'scaleX(1) scale(1.2)';
            setTimeout(() => {
                decoration.style.transform = decoration.classList.contains('left')
                    ? 'scaleX(-1)'
                    : 'scaleX(1)';
            }, 200);
        };
        
        // 检查是否已有天鹅，决定放在左边还是右边
        const existingSwans = document.querySelectorAll('.swan').length;
        if (existingSwans === 0) {
            decoration.classList.add('left');
            decoration.style.left = '30px';
            decoration.style.bottom = '40px';
        } else if (existingSwans === 1) {
            decoration.classList.add('right');
            decoration.style.right = '30px';
            decoration.style.bottom = '40px';
        } else {
            return; // 最多只允许两只天鹅
        }
    } else {
        decoration.className = 'decoration';
        switch(type) {
            case '草莓': decoration.innerHTML = '🍓'; break;
            case '星星': decoration.innerHTML = '⭐'; break;
            case '礼物': decoration.innerHTML = '🎁'; break;
        }
        // 随机位置
        decoration.style.left = Math.random() * 160 + 70 + 'px';
        decoration.style.top = Math.random() * 160 + 70 + 'px';
    }
    
    if (type !== '黑天鹅') {
        makeDraggable(decoration);
    }
    
    cake.appendChild(decoration);
    decorationCount++;
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function resetCake() {
    const cake = document.getElementById('cake');
    const decorations = document.getElementsByClassName('decoration');
    const candles = document.querySelectorAll('.candle:not(.big-candle)');
    
    while(decorations.length > 0) {
        decorations[0].remove();
    }
    while(candles.length > 0) {
        candles[0].remove();
    }
    
    // 重置大蜡烛状态并重新点燃
    const bigCandle = document.querySelector('.big-candle');
    if (bigCandle) {
        lightCandle(bigCandle);
    }
    
    decorationCount = 0;
}

// 添加音频相关代码
let audioContext = null;
let isPlaying = false;
let currentNoteIndex = 0;
let nextNoteTime = 0.0;
let timerID = null;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function toggleBirthdaySong() {
    if (!audioContext) {
        initAudio();
    }
    
    const musicBtn = document.getElementById('musicBtn');
    
    if (!isPlaying) {
        isPlaying = true;
        musicBtn.textContent = '🔇 停止音乐';
        nextNoteTime = audioContext.currentTime;
        scheduler();
    } else {
        isPlaying = false;
        musicBtn.textContent = '🎵 播放音乐';
        clearTimeout(timerID);
    }
}

function playNote(time, frequency) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.5, time + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, time + 0.4);
    
    oscillator.start(time);
    oscillator.stop(time + 0.5);
}

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + 0.1) {
        const freq = getNextNoteFrequency();
        playNote(nextNoteTime, freq);
        nextNoteTime += 0.5; // 每个音符的时长
    }
    timerID = setTimeout(scheduler, 50.0);
}

function getNextNoteFrequency() {
    // 简单的音符序列
    const notes = [
        262, 262, 294, 262, 349, 330,    // 第一行
        262, 262, 294, 262, 392, 349,    // 第二行
        262, 262, 523, 440, 349, 330, 294, // 最后一行
        466, 466, 440, 349, 392, 349      // 结束
    ];
    
    const freq = notes[currentNoteIndex];
    currentNoteIndex = (currentNoteIndex + 1) % notes.length;
    return freq;
}

// 添加音频分析相关变量
let audioStream = null;
let analyser = null;
let dataArray = null;
let blowDetected = false;
let blowTimeout = null;

// 添加蜡烛开关功能
function toggleCandle(event) {
    const candle = event.target;
    if (candle.classList.contains('lit')) {
        blowOutCandle(candle);
    } else {
        lightCandle(candle);
    }
}

// 添加点燃蜡烛的函数
function lightCandle(candle) {
    candle.classList.add('lit');
    candle.classList.remove('blown');
    
    // 设置自动熄灭定时器
    const burnTime = candle.classList.contains('big-candle') ? 30000 : 20000; // 大蜡烛30秒，小蜡烛20秒
    setTimeout(() => {
        if (candle.classList.contains('lit')) {
            blowOutCandle(candle);
        }
    }, burnTime);
}

// 添加熄灭蜡烛的函数
function blowOutCandle(candle) {
    candle.classList.remove('lit');
    candle.classList.add('blown');
}

// 修改吹灭所有蜡烛的函数
function blowOutCandles() {
    const candles = document.querySelectorAll('.candle.lit');
    candles.forEach(candle => {
        blowOutCandle(candle);
    });
}

// 显示吹蜡烛提示
function showBlowHint() {
    const hint = document.createElement('div');
    hint.className = 'blow-hint show';
    hint.textContent = '点击蜡烛可以重新点燃，对着麦克风吹气可以吹灭所有蜡烛哦！';
    document.body.appendChild(hint);
    
    // 3秒后隐藏提示
    setTimeout(() => {
        hint.remove();
    }, 3000);
    
    // 初始化麦克风
    initMicrophone();
}

// 添加天鹅叫声相关代码
function playSwanSound() {
    if (!audioContext) {
        initAudio();
    }
    
    // 创建音频节点
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 设置音色和频率
    oscillator.type = 'sine';
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
    
    // 设置频率滑动（模拟天鹅叫声的特征）
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.8);
    
    // 开始播放
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化大蜡烛的点击事件和点燃状态
    const bigCandle = document.querySelector('.big-candle');
    if (bigCandle) {
        bigCandle.onclick = toggleCandle;
        lightCandle(bigCandle);
    }
    
    // 显示提示并初始化麦克风
    showBlowHint();
}); 