const COLORS = [
  '#e63946','#f4a261','#e9c46a','#2a9d8f','#457b9d',
  '#8338ec','#fb5607','#06d6a0','#118ab2','#ef476f',
  '#f77f00','#4cc9f0','#7b2d8b','#3a86ff','#d62828',
];

let options = [];   // { text, color }
let angle   = 0;    // current rotation in radians
let spinning = false;

const canvas        = document.getElementById('wheel-canvas');
const ctx           = canvas.getContext('2d');
const spinBtn       = document.getElementById('spin-btn');
const resultDisplay = document.getElementById('result-display');
const emptyHint     = document.getElementById('empty-hint');
const optionsList   = document.getElementById('options-list');
const newInput      = document.getElementById('new-option-input');
const addBtn        = document.getElementById('add-btn');

// ── Drawing ────────────────────────────────────────────────────────────────

function drawWheel() {
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, R = W / 2 - 4;
  ctx.clearRect(0, 0, W, H);

  if (options.length === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#0f3460';
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#444';
    ctx.font = 'bold 18px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No options', cx, cy);
    return;
  }

  const n = options.length;
  const slice = (Math.PI * 2) / n;

  for (let i = 0; i < n; i++) {
    const start = angle + i * slice;
    const end   = start + slice;

    // segment
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();
    ctx.fillStyle = options[i].color;
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const maxLen = R - 18;
    const fontSize = Math.max(10, Math.min(18, (slice * R * 0.45)));
    ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;

    let label = options[i].text;
    // truncate if needed
    while (ctx.measureText(label).width > maxLen && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== options[i].text) label = label.slice(0, -1) + '…';

    ctx.fillText(label, R - 12, 0);
    ctx.restore();
  }

  // outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ── Spinning ───────────────────────────────────────────────────────────────

function spin() {
  if (spinning || options.length < 1) return;
  spinning = true;
  spinBtn.disabled = true;
  resultDisplay.textContent = '';
  resultDisplay.classList.remove('show');
  canvas.classList.add('spinning');

  const extraSpins  = (5 + Math.random() * 6) * Math.PI * 2;
  const targetAngle = angle + extraSpins;
  const duration    = 3500 + Math.random() * 1500; // ms
  const startAngle  = angle;
  const startTime   = performance.now();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    angle = startAngle + (targetAngle - startAngle) * easeOut(t);
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      angle = targetAngle % (Math.PI * 2);
      spinning = false;
      spinBtn.disabled = false;
      canvas.classList.remove('spinning');
      showResult();
    }
  }

  requestAnimationFrame(frame);
}

function showResult() {
  const n = options.length;
  const slice = (Math.PI * 2) / n;
  // Canvas 0 rad = east (3 o'clock); pointer sits at north = 3π/2.
  // Rotate the pointer into the wheel's local frame, then find which slice it lands in.
  // The double-mod trick keeps the value in [0, 2π) even when (3π/2 - angle) is negative.
  const pointerAngle = ((3 * Math.PI / 2 - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const idx    = Math.floor(pointerAngle / slice) % n;
  const winner = options[idx];

  resultDisplay.style.setProperty('--winner-color', winner.color);
  resultDisplay.style.setProperty('--winner-bg', winner.color + '30'); // 30 = ~19% opacity hex
  resultDisplay.textContent = winner.text;
  resultDisplay.classList.add('show');
}

spinBtn.addEventListener('click', spin);
canvas.addEventListener('click', spin);

// ── Options management ─────────────────────────────────────────────────────

function colorFor(i) {
  return COLORS[i % COLORS.length];
}

function addOption(text) {
  text = text.trim();
  if (!text) return;
  options.push({ text, color: colorFor(options.length) });
  renderList();
  drawWheel();
  updateHint();
}

function removeOption(i) {
  options.splice(i, 1);
  // reassign colors so they stay consistent
  options.forEach((o, idx) => { o.color = colorFor(idx); });
  renderList();
  drawWheel();
  updateHint();
}

function saveEdit(i, newText) {
  newText = newText.trim();
  if (!newText) return;
  options[i].text = newText;
  renderList();
  drawWheel();
}

function renderList() {
  optionsList.innerHTML = '';
  if (options.length === 0) {
    optionsList.innerHTML = '<p class="no-options">No options yet</p>';
    return;
  }

  options.forEach((opt, i) => {
    const item = document.createElement('div');
    item.className = 'option-item';

    const dot = document.createElement('span');
    dot.className = 'option-color-dot';
    dot.style.background = opt.color;

    const label = document.createElement('span');
    label.className = 'option-label';
    label.title = opt.text;
    label.textContent = opt.text;

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon edit';
    editBtn.title = 'Edit';
    editBtn.textContent = '✎';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-icon remove';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '✕';

    editBtn.addEventListener('click', () => startEdit(item, i, opt.text, dot));
    removeBtn.addEventListener('click', () => removeOption(i));

    item.append(dot, label, editBtn, removeBtn);
    optionsList.appendChild(item);
  });
}

function startEdit(item, i, currentText, dot) {
  item.innerHTML = '';

  const input = document.createElement('input');
  input.className = 'option-edit-input';
  input.value = currentText;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-icon save';
  saveBtn.title = 'Save';
  saveBtn.textContent = '✓';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-icon cancel';
  cancelBtn.title = 'Cancel';
  cancelBtn.textContent = '✕';

  saveBtn.addEventListener('click', () => saveEdit(i, input.value));
  cancelBtn.addEventListener('click', () => renderList());
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEdit(i, input.value);
    if (e.key === 'Escape') renderList();
  });

  item.append(dot, input, saveBtn, cancelBtn);
  input.focus();
  input.select();
}

function updateHint() {
  emptyHint.style.display = options.length > 0 ? 'none' : 'inline';
}

// ── Input bar ──────────────────────────────────────────────────────────────

function commitInput() {
  const val = newInput.value;
  if (val.trim()) {
    addOption(val);
    newInput.value = '';
  }
  newInput.focus();
}

addBtn.addEventListener('click', commitInput);
newInput.addEventListener('keydown', e => { if (e.key === 'Enter') commitInput(); });

// ── Init ───────────────────────────────────────────────────────────────────
drawWheel();
updateHint();
