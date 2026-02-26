const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

const optionInput = document.getElementById('optionInput');
const addBtn = document.getElementById('addBtn');
const addExampleBtn = document.getElementById('addExampleBtn');
const clearBtn = document.getElementById('clearBtn');
const spinBtn = document.getElementById('spinBtn');
const optionList = document.getElementById('optionList');
const resultEl = document.getElementById('result');

// 音效文件放在 /sound 目录下
// 例如：sound/spin.m4a 和 sound/result.m4a
let clickSound;
let resultSound;

try {
  clickSound = new Audio('sound/spin.m4a');
  resultSound = new Audio('sound/result.m4a');
} catch {
  // 某些老浏览器可能不支持 Audio 构造函数，静默降级
}

let options = [];
let startAngle = 0;
let isSpinning = false;

function addOption(text) {
  const val = text.trim();
  if (!val) return;
  options.push(val);
  updateList();
  drawWheel();
}

addBtn.onclick = () => {
  addOption(optionInput.value);
  optionInput.value = '';
  optionInput.focus();
};

optionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addBtn.click();
  }
});

addExampleBtn.onclick = () => {
  if (options.length) return;
  ['选项A', '选项B', '选项C', '选项D'].forEach(addOption);
};

clearBtn.onclick = () => {
  options = [];
  startAngle = 0;
  updateList();
  drawWheel();
  resultEl.textContent = '';
};

spinBtn.onclick = () => {
  if (isSpinning) return;
  if (options.length < 2) {
    alert('请先添加至少 2 个选项');
    return;
  }

  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  isSpinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = '正在抽取…';

  const spinAngle = Math.random() * Math.PI * 8 + Math.PI * 6;
  const duration = 3200;
  const startTime = performance.now();

  function animate(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(t);

    drawWheel(startAngle + spinAngle * eased);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      startAngle = normalizeAngle(startAngle + spinAngle);
      const winnerIndex = getWinnerIndex();
      const winner = options[winnerIndex];
      resultEl.textContent = winner ? `结果：${winner}` : '';

      if (winner && resultSound) {
        resultSound.currentTime = 0;
        resultSound.play().catch(() => {});
      }
      isSpinning = false;
      spinBtn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function getWinnerIndex() {
  const len = options.length;
  if (!len) return -1;
  const arc = (Math.PI * 2) / len;
  // 指针现在在轮盘上方，对准 12 点方向
  const pointerAngle = -Math.PI / 2;
  let delta = normalizeAngle(pointerAngle - startAngle);
  return Math.floor(delta / arc) % len;
}

function updateList() {
  optionList.innerHTML = '';
  options.forEach((o, i) => {
    const li = document.createElement('li');
    li.className = 'entry-item';

    const label = document.createElement('span');
    label.className = 'entry-label';
    label.textContent = o;

    const remove = document.createElement('button');
    remove.className = 'remove-btn';
    remove.textContent = '✕';
    remove.onclick = () => {
      options.splice(i, 1);
      updateList();
      drawWheel();
    };

    li.appendChild(label);
    li.appendChild(remove);
    optionList.appendChild(li);
  });
}

function drawWheel(angleOverride) {
  const angle = angleOverride != null ? angleOverride : startAngle;
  const len = options.length;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!len) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e5e7eb';
    ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('添加一些选项开始抽取', centerX, centerY);
    return;
  }

  const arc = (Math.PI * 2) / len;

  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  options.forEach((opt, i) => {
    const start = angle + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = `hsl(${(i * 360) / len}, 75%, 62%)`;
    ctx.fill();
    // 白色分界线（只有多个选项时才需要）
    if (len > 1) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.stroke();
    }

    const mid = start + arc / 2;
    const textRadius = radius * 0.65;
    const textX = centerX + Math.cos(mid) * textRadius;
    const textY = centerY + Math.sin(mid) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(mid + Math.PI / 2);
    ctx.fillStyle = '#111827';
    const maxWidth = radius * 0.6;
    const text = opt.length > 16 ? opt.slice(0, 16) + '…' : opt;
    ctx.fillText(text, 0, 0, maxWidth);
    ctx.restore();
  });
}

// 初始状态渲染
drawWheel();