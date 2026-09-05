// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const paddle = {
    width: 10,
    height: 80,
    x: 10,
    y: canvas.height / 2 - 40,
    speed: 6,
    dy: 0
};

const aiPaddle = {
    width: 10,
    height: 80,
    x: canvas.width - 20,
    y: canvas.height / 2 - 40,
    speed: 5
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 7,
    dx: 5,
    dy: 5,
    speed: 5
};

let playerScore = 0;
let aiScore = 0;

// Input handling
const keys = {};
let mouseY = canvas.height / 2;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Update player paddle position
function updatePlayerPaddle() {
    // Arrow keys control
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        paddle.y -= paddle.speed;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        paddle.y += paddle.speed;
    }

    // Mouse control
    const targetY = mouseY - paddle.height / 2;
    paddle.y += (targetY - paddle.y) * 0.1; // Smooth mouse following

    // Collision with top and bottom walls
    if (paddle.y < 0) {
        paddle.y = 0;
    }
    if (paddle.y + paddle.height > canvas.height) {
        paddle.y = canvas.height - paddle.height;
    }
}

// Update AI paddle position
function updateAIPaddle() {
    const paddleCenter = aiPaddle.y + aiPaddle.height / 2;
    const difficulty = 0.08; // Adjust for difficulty (0-1)

    // AI follows the ball with some imperfection
    if (paddleCenter < ball.y - 35) {
        aiPaddle.y += aiPaddle.speed * (1 - difficulty * 0.5);
    } else if (paddleCenter > ball.y + 35) {
        aiPaddle.y -= aiPaddle.speed * (1 - difficulty * 0.5);
    }

    // Collision with top and bottom walls
    if (aiPaddle.y < 0) {
        aiPaddle.y = 0;
    }
    if (aiPaddle.y + aiPaddle.height > canvas.height) {
        aiPaddle.y = canvas.height - aiPaddle.height;
    }
}

// Ball physics and collision detection
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : canvas.height - ball.radius;
    }

    // Player paddle collision
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = paddle.x + paddle.width + ball.radius;

        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        ball.dy += hitPos * 2;
    }

    // AI paddle collision
    if (
        ball.x + ball.radius > aiPaddle.x &&
        ball.y > aiPaddle.y &&
        ball.y < aiPaddle.y + aiPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = aiPaddle.x - ball.radius;

        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (aiPaddle.y + aiPaddle.height / 2)) / (aiPaddle.height / 2);
        ball.dy += hitPos * 2;
    }

    // Scoring - ball goes out of bounds
    if (ball.x - ball.radius < 0) {
        aiScore++;
        document.getElementById('aiScore').textContent = aiScore;
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        resetBall();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
}

// Draw functions
function drawPaddle(paddleObj, color) {
    ctx.fillStyle = color;
    ctx.fillRect(paddleObj.x, paddleObj.y, paddleObj.width, paddleObj.height);
}

function drawBall() {
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawCenterLine();
    drawPaddle(paddle, '#00ff00');
    drawPaddle(aiPaddle, '#ff0000');
    drawBall();
}

// Main game loop
function gameLoop() {
    updatePlayerPaddle();
    updateAIPaddle();
    updateBall();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
