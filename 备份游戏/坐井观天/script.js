const frog = document.getElementById('frog');
const bird = document.getElementById('bird');
const dialog = document.getElementById('dialog');
const jumpBtn = document.getElementById('jumpBtn');

const sounds = {
    jump: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/'),
    success: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf35+fX19fHx7e3p6eXl4eHd3dnZ1dXR0c3NycnFxcHBvb25ubW1sbGtramppaWhoZ2dmZmVlZGRjY2JiYWFgYF9fXl5dXVxcW1taWllZWFhXV1ZWVVVUVFNTUlJRUVBQT09OTk1NTExLS0pKSUlISEdHRkZFRUREQ0NCQkFBQEA/Pz4+PT08PDsLOzs6Ojk5ODg3NzY2NTU0NDMzMjIxMTAwLy8uLi0tLCwrKyoqKSkpKCgnJyYmJSUkJCMjIiIhISAgHx8eHh0dHBwbGxoaGRkYGBcXFhYVFRQUExMSEhEREBAP'),
    fail: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf35+fX19fHx7e3p6eXl4eHd3dnZ1dXR0c3NycnFxcHBvb25ubW1sbGtramppaWhoZ2dmZmVlZGRjY2JiYWFgYF9fXl5dXVxcW1taWllZWFhXV1ZWVVVUVFNTUlJRUVBQT09OTk1NTExLS0pKSUlISEdHRkZFRUREQ0NCQkFBQEA/Pz4+PT08PDsLOzs6Ojk5ODg3NzY2NTU0NDMzMjIxMTAwLy8uLi0tLCwrKyoqKSkpKCgnJyYmJSUkJCMjIiIhISAgHx8eHh0dHBwbGxoaGRkYGBcXFhYVFRQUExMSEhEREBAP')
};

function speak(text, voice = 'frog') {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = voice === 'frog' ? 0.9 : 1.1;
        utterance.pitch = voice === 'frog' ? 0.8 : 1.3;
        speechSynthesis.speak(utterance);
    }
}

function playSound(type) {
    sounds[type].currentTime = 0;
    sounds[type].play().catch(() => {});
}

const conversations = [
    { speaker: '青蛙', text: '小鸟，你从哪里来？' },
    { speaker: '小鸟', text: '我从天上来，飞了一百多里。' },
    { speaker: '青蛙', text: '朋友，别说大话了！天不过井口那么大，还用飞那么远吗？' },
    { speaker: '小鸟', text: '你弄错了，天无边无际，大得很哪！' },
    { speaker: '青蛙', text: '我天天坐在井里，一抬头就看见天。我不会弄错的。' },
    { speaker: '小鸟', text: '你跳出井口来看一看，就知道天有多大了。' }
];

let step = 0;
let jumpStep = 0;
let isJumping = false;
let power = 0;
let powerInterval;

const stones = [
    { x: 20, y: 80, tolerance: 25 },
    { x: 220, y: 160, tolerance: 25 },
    { x: 30, y: 240, tolerance: 25 },
    { x: 200, y: 320, tolerance: 25 },
    { x: 40, y: 400, tolerance: 25 },
    { x: 210, y: 480, tolerance: 25 },
    { x: 30, y: 560, tolerance: 20 },
    { x: 125, y: 640, tolerance: 30 }
];

function showDialog(text, speakText = null) {
    dialog.textContent = text;
    dialog.style.display = 'block';
    
    if (speakText !== null) {
        const match = text.match(/^(青蛙|小鸟)：(.+)$/);
        if (match) {
            const speaker = match[1];
            const content = match[2];
            speak(content, speaker === '青蛙' ? 'frog' : 'bird');
        }
    }
}

function nextConversation() {
    if (step < conversations.length) {
        const { speaker, text } = conversations[step];
        showDialog(`${speaker}：${text}`, true);
        step++;
        
        if (step === conversations.length) {
            jumpBtn.textContent = '准备跳跃（按住蓄力）';
            setTimeout(() => {
                showDialog('小鸟：你跳出井口来看一看！（按住按钮蓄力，松开跳跃）', true);
            }, 2000);
        }
    } else if (jumpStep < 8 && !isJumping) {
        startJumpMode();
    }
}

function startJumpMode() {
    isJumping = true;
    const powerBar = document.getElementById('powerBar');
    const powerFill = document.getElementById('powerFill');
    powerBar.style.display = 'block';
    
    jumpBtn.addEventListener('mousedown', chargePower);
    jumpBtn.addEventListener('mouseup', releaseJump);
    jumpBtn.addEventListener('touchstart', chargePower);
    jumpBtn.addEventListener('touchend', releaseJump);
}

function chargePower(e) {
    e.preventDefault();
    power = 0;
    const powerFill = document.getElementById('powerFill');
    
    powerInterval = setInterval(() => {
        power += 3;
        if (power > 100) power = 0;
        powerFill.style.width = power + '%';
    }, 15);
}

function releaseJump(e) {
    e.preventDefault();
    clearInterval(powerInterval);
    
    playSound('jump');
    
    const target = stones[jumpStep];
    const powerDiff = Math.abs(power - 50);
    const randomX = target.x + (Math.random() - 0.5) * power * 1.2 + (Math.random() - 0.5) * 30;
    const randomY = target.y + (Math.random() - 0.5) * power * 0.9 + (Math.random() - 0.5) * 25;
    
    frog.style.bottom = randomY + 'px';
    frog.style.left = randomX + 'px';
    
    setTimeout(() => {
        checkLanding(randomX, randomY, target);
    }, 600);
}

function checkLanding(x, y, target) {
    const distance = Math.sqrt(Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2));
    
    if (distance < target.tolerance) {
        playSound('success');
        jumpStep++;
        if (jumpStep === 8) {
            document.getElementById('powerBar').style.display = 'none';
            jumpBtn.style.display = 'none';
            showDialog('青蛙：哇！原来天真的这么大！我明白了！', true);
        } else {
            showDialog(`成功！继续跳到下一块石头 (${jumpStep}/8)`);
        }
    } else {
        playSound('fail');
        frog.style.bottom = '50px';
        frog.style.left = '50%';
        showDialog('青蛙：哎呀！没跳准，重新来！', true);
    }
    
    isJumping = false;
    document.getElementById('powerFill').style.width = '0%';
}

jumpBtn.addEventListener('click', () => {
    if (step === 0) {
        jumpBtn.textContent = '继续对话';
    }
    nextConversation();
});

bird.addEventListener('click', () => {
    if (step > 0 && step < conversations.length) {
        nextConversation();
    }
});

frog.addEventListener('click', () => {
    if (step > 0 && step < conversations.length) {
        nextConversation();
    }
});
