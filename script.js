const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const gameOver = document.getElementById('gameOver');
const pauseOverlay = document.getElementById('pauseOverlay');
const statusEl = document.getElementById('status');

let difficulty = 'normal', targetScore = 5, running = false, paused = false;
let playerScore = 0, aiScore = 0, rally = 0, bestRally = 0, pointsWon = 0;
let soundOn = true, audioCtx;
const keys = {};
let pointerY = canvas.height / 2;

const player = { x: 22, y: 210, w: 12, h: 80, speed: 8 };
const ai = { x: canvas.width - 34, y: 210, w: 12, h: 80, speed: 5.2 };
const ball = { x: 450, y: 250, r: 8, vx: 5, vy: 2.5, maxSpeed: 12 };

function beep(freq = 440, duration = 0.05) {
  if (!soundOn) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.035;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function resetBall(direction = Math.random() > .5 ? 1 : -1) {
  ball.x = canvas.width / 2; ball.y = canvas.height / 2;
  ball.vx = direction * 5; ball.vy = (Math.random() - .5) * 5;
  rally = 0;
}

function resetMatch() {
  playerScore = aiScore = 0; pointsWon = 0; bestRally = 0; rally = 0;
  player.y = ai.y = canvas.height / 2 - 40;
  resetBall(); updateScore();
}

function updateScore() {
  document.getElementById('playerScore').textContent = playerScore;
  document.getElementById('aiScore').textContent = aiScore;
  document.getElementById('targetDisplay').textContent = targetScore;
}

function clampPaddles() {
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
  ai.y = Math.max(0, Math.min(canvas.height - ai.h, ai.y));
}

function updatePlayer() {
  if (keys.ArrowUp || keys.w || keys.W) player.y -= player.speed;
  if (keys.ArrowDown || keys.s || keys.S) player.y += player.speed;
  const target = pointerY - player.h / 2;
  if (Math.abs(pointerY - canvas.height / 2) > 8) player.y += (target - player.y) * 0.16;
}

function updateAI() {
  const settings = { easy: [3.6, 55], normal: [5.2, 28], hard: [7.2, 10] }[difficulty];
  const [speed, margin] = settings;
  const center = ai.y + ai.h / 2;
  if (center < ball.y - margin) ai.y += speed;
  else if (center > ball.y + margin) ai.y -= speed;
}

function paddleHit(p) {
  return ball.x - ball.r < p.x + p.w && ball.x + ball.r > p.x && ball.y > p.y && ball.y < p.y + p.h;
}

function hitPaddle(p, direction) {
  const relative = (ball.y - (p.y + p.h / 2)) / (p.h / 2);
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.055, ball.maxSpeed);
  ball.vx = direction * Math.sqrt(Math.max(16, speed * speed - (relative * speed * 0.9) ** 2));
  ball.vy = relative * speed * 0.9;
  ball.x = direction > 0 ? p.x + p.w + ball.r : p.x - ball.r;
  rally++; bestRally = Math.max(bestRally, rally); beep(650, 0.035);
}

function scorePoint(side) {
  if (side === 'player') { playerScore++; pointsWon++; beep(880, 0.12); }
  else { aiScore++; beep(180, 0.12); }
  updateScore();
  if (playerScore >= targetScore || aiScore >= targetScore) return finishMatch();
  statusEl.textContent = side === 'player' ? 'POINT PLAYER' : 'POINT AI';
  resetBall(side === 'player' ? 1 : -1);
}

function updateBall() {
  ball.x += ball.vx; ball.y += ball.vy;
  if (ball.y - ball.r <= 0 || ball.y + ball.r >= canvas.height) {
    ball.vy *= -1; ball.y = Math.max(ball.r, Math.min(canvas.height - ball.r, ball.y)); beep(300, 0.025);
  }
  if (ball.vx < 0 && paddleHit(player)) hitPaddle(player, 1);
  if (ball.vx > 0 && paddleHit(ai)) hitPaddle(ai, -1);
  if (ball.x < -ball.r) scorePoint('ai');
  if (ball.x > canvas.width + ball.r) scorePoint('player');
}

function draw() {
  ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.setLineDash([12, 14]); ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke(); ctx.setLineDash([]);
  ctx.shadowBlur = 18; ctx.fillStyle = '#63ffda'; ctx.shadowColor = '#63ffda'; ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#ff5c8a'; ctx.shadowColor = '#ff5c8a'; ctx.fillRect(ai.x, ai.y, ai.w, ai.h);
  ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
}

function loop() {
  if (running && !paused) { updatePlayer(); updateAI(); clampPaddles(); updateBall(); }
  draw(); requestAnimationFrame(loop);
}

function startGame() {
  menu.classList.add('hidden'); gameOver.classList.add('hidden'); game.classList.remove('hidden');
  resetMatch(); running = true; paused = false; pauseOverlay.classList.add('hidden'); statusEl.textContent = 'FIGHT!';
}
function finishMatch() {
  running = false; game.classList.add('hidden'); gameOver.classList.remove('hidden');
  const won = playerScore > aiScore;
  document.getElementById('winnerText').textContent = won ? 'PLAYER WINS' : 'AI WINS';
  document.getElementById('finalScore').textContent = `${playerScore} — ${aiScore}`;
  document.getElementById('rallyStat').textContent = bestRally;
  document.getElementById('pointsStat').textContent = pointsWon;
}
function togglePause() {
  if (!running) return; paused = !paused; pauseOverlay.classList.toggle('hidden', !paused); statusEl.textContent = paused ? 'PAUSED' : 'FIGHT!';
}

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  if (e.key.toLowerCase() === 'p') togglePause();
});
window.addEventListener('keyup', e => keys[e.key] = false);
function setPointer(e) {
  const rect = canvas.getBoundingClientRect(); pointerY = (e.clientY - rect.top) * (canvas.height / rect.height);
}
canvas.addEventListener('mousemove', setPointer);
canvas.addEventListener('touchmove', e => { e.preventDefault(); setPointer(e.touches[0]); }, { passive: false });

for (const btn of document.querySelectorAll('.mode-btn')) btn.onclick = () => { document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); difficulty = btn.dataset.difficulty; };
for (const btn of document.querySelectorAll('.target-btn')) btn.onclick = () => { document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); targetScore = Number(btn.dataset.target); };
document.getElementById('startBtn').onclick = startGame;
document.getElementById('rematchBtn').onclick = startGame;
document.getElementById('menuBtn').onclick = () => { gameOver.classList.add('hidden'); menu.classList.remove('hidden'); };
document.getElementById('quitBtn').onclick = () => { running = false; game.classList.add('hidden'); menu.classList.remove('hidden'); };
document.getElementById('pauseBtn').onclick = togglePause;
document.getElementById('soundBtn').onclick = e => { soundOn = !soundOn; e.currentTarget.textContent = soundOn ? '🔊' : '🔇'; };

updateScore(); draw(); loop();
