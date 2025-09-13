// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏设置
const GRID_SIZE = 20;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;

// 游戏状态
let gameRunning = false;
let gamePaused = false;
let gameLoopId = null;
let score1 = 0;
let score2 = 0;

// 玩家1的蛇
const snake1 = {
    body: [
        { x: 5, y: 15 },
        { x: 4, y: 15 },
        { x: 3, y: 15 }
    ],
    direction: 'right',
    nextDirection: 'right',
    color: '#4CAF50'
};

// 玩家2的蛇
const snake2 = {
    body: [
        { x: GRID_WIDTH - 6, y: 15 },
        { x: GRID_WIDTH - 5, y: 15 },
        { x: GRID_WIDTH - 4, y: 15 }
    ],
    direction: 'left',
    nextDirection: 'left',
    color: '#2196F3'
};

// 食物
let food = generateFood();
let specialFood = null;
let specialFoodTimer = 0;
const SPECIAL_FOOD_DURATION = 5000; // 5秒
const SPECIAL_FOOD_INTERVAL = 15000; // 15秒

// 按键状态
const keys = {};

// 获取DOM元素
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const restartButton = document.getElementById('restartButton');
const player1ScoreElement = document.getElementById('player1-score');
const player2ScoreElement = document.getElementById('player2-score');
const gameOverModal = document.getElementById('gameOverModal');
const winnerText = document.getElementById('winnerText');

// 初始化游戏
function initGame() {
    resetGame();
    drawGame();
    setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // 玩家1控制
        if (e.key === 'w' && snake1.direction !== 'down') {
            snake1.nextDirection = 'up';
        } else if (e.key === 's' && snake1.direction !== 'up') {
            snake1.nextDirection = 'down';
        } else if (e.key === 'a' && snake1.direction !== 'right') {
            snake1.nextDirection = 'left';
        } else if (e.key === 'd' && snake1.direction !== 'left') {
            snake1.nextDirection = 'right';
        }
        
        // 玩家2控制
        if (e.key === 'ArrowUp' && snake2.direction !== 'down') {
            snake2.nextDirection = 'up';
        } else if (e.key === 'ArrowDown' && snake2.direction !== 'up') {
            snake2.nextDirection = 'down';
        } else if (e.key === 'ArrowLeft' && snake2.direction !== 'right') {
            snake2.nextDirection = 'left';
        } else if (e.key === 'ArrowRight' && snake2.direction !== 'left') {
            snake2.nextDirection = 'right';
        }
        
        // 空格键暂停/继续
        if (e.key === ' ' && gameRunning) {
            togglePause();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // 按钮控制
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);
    restartButton.addEventListener('click', restartGame);
}

// 开始游戏
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        gameLoopId = setInterval(gameLoop, 100); // 100ms每帧
        startButton.disabled = true;
        pauseButton.disabled = false;
        resetButton.disabled = false;
    }
}

// 暂停/继续游戏
function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        if (gamePaused) {
            clearInterval(gameLoopId);
            pauseButton.textContent = '继续游戏';
        } else {
            gameLoopId = setInterval(gameLoop, 100);
            pauseButton.textContent = '暂停游戏';
        }
    }
}

// 重置游戏
function resetGame() {
    // 停止游戏循环
    clearInterval(gameLoopId);
    
    // 重置游戏状态
    gameRunning = false;
    gamePaused = false;
    score1 = 0;
    score2 = 0;
    specialFood = null;
    specialFoodTimer = 0;
    
    // 重置蛇的位置和方向
    snake1.body = [
        { x: 5, y: 15 },
        { x: 4, y: 15 },
        { x: 3, y: 15 }
    ];
    snake1.direction = 'right';
    snake1.nextDirection = 'right';
    
    snake2.body = [
        { x: GRID_WIDTH - 6, y: 15 },
        { x: GRID_WIDTH - 5, y: 15 },
        { x: GRID_WIDTH - 4, y: 15 }
    ];
    snake2.direction = 'left';
    snake2.nextDirection = 'left';
    
    // 生成新食物
    food = generateFood();
    
    // 更新UI
    updateScore();
    drawGame();
    gameOverModal.style.display = 'none';
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = true;
    pauseButton.textContent = '暂停游戏';
}

// 重新开始游戏
function restartGame() {
    resetGame();
    startGame();
}

// 游戏循环
function gameLoop() {
    // 更新特殊食物计时器
    updateSpecialFoodTimer();
    
    // 更新蛇的方向
    snake1.direction = snake1.nextDirection;
    snake2.direction = snake2.nextDirection;
    
    // 移动蛇
    moveSnake(snake1);
    moveSnake(snake2);
    
    // 检查碰撞
    const collision1 = checkCollisions(snake1, snake2);
    const collision2 = checkCollisions(snake2, snake1);
    
    // 如果有碰撞，游戏结束
    if (collision1 || collision2) {
        endGame(collision1, collision2);
        return;
    }
    
    // 检查是否吃到普通食物
    checkFood(snake1);
    checkFood(snake2);
    
    // 检查是否吃到特殊食物
    if (specialFood) {
        checkSpecialFood(snake1);
        checkSpecialFood(snake2);
    }
    
    // 绘制游戏
    drawGame();
}

// 更新特殊食物计时器
function updateSpecialFoodTimer() {
    specialFoodTimer++;
    
    // 每15秒生成一个特殊食物
    if (specialFoodTimer % 150 === 0 && !specialFood) {
        specialFood = generateSpecialFood();
        specialFoodTimer = 0;
    }
    
    // 特殊食物持续5秒后消失
    if (specialFood && specialFoodTimer > 50) {
        specialFood = null;
        specialFoodTimer = 0;
    }
}

// 移动蛇
function moveSnake(snake) {
    const head = { ...snake.body[0] };
    
    // 根据方向移动头部
    switch (snake.direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // 处理边界情况（穿墙）
    if (head.x < 0) head.x = GRID_WIDTH - 1;
    if (head.x >= GRID_WIDTH) head.x = 0;
    if (head.y < 0) head.y = GRID_HEIGHT - 1;
    if (head.y >= GRID_HEIGHT) head.y = 0;
    
    // 添加新头部
    snake.body.unshift(head);
}

// 检查碰撞
function checkCollisions(snake, otherSnake) {
    const head = snake.body[0];
    
    // 检查是否撞到自己
    for (let i = 1; i < snake.body.length; i++) {
        if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
            return true;
        }
    }
    
    // 检查是否撞到另一条蛇
    for (let i = 0; i < otherSnake.body.length; i++) {
        if (head.x === otherSnake.body[i].x && head.y === otherSnake.body[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查是否吃到普通食物
function checkFood(snake) {
    const head = snake.body[0];
    
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        if (snake === snake1) {
            score1++;
        } else {
            score2++;
        }
        
        // 更新分数显示
        updateScore();
        
        // 生成新食物
        food = generateFood();
    } else {
        // 如果没吃到食物，移除尾部
        snake.body.pop();
    }
}

// 检查是否吃到特殊食物
function checkSpecialFood(snake) {
    const head = snake.body[0];
    
    if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        // 增加更多分数
        if (snake === snake1) {
            score1 += 3;
        } else {
            score2 += 3;
        }
        
        // 更新分数显示
        updateScore();
        
        // 移除特殊食物
        specialFood = null;
        specialFoodTimer = 0;
        
        // 蛇身不增加
    }
}

// 生成普通食物
function generateFood() {
    let newFood;
    
    // 确保食物不会出现在蛇身上
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
    } while (isOnSnake(newFood, snake1) || isOnSnake(newFood, snake2) || (specialFood && newFood.x === specialFood.x && newFood.y === specialFood.y));
    
    return newFood;
}

// 生成特殊食物
function generateSpecialFood() {
    let newSpecialFood;
    
    // 确保特殊食物不会出现在蛇身上或普通食物位置
    do {
        newSpecialFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
    } while (isOnSnake(newSpecialFood, snake1) || isOnSnake(newSpecialFood, snake2) || (newSpecialFood.x === food.x && newSpecialFood.y === food.y));
    
    return newSpecialFood;
}

// 检查位置是否在蛇身上
function isOnSnake(position, snake) {
    for (let segment of snake.body) {
        if (segment.x === position.x && segment.y === position.y) {
            return true;
        }
    }
    return false;
}

// 更新分数显示
function updateScore() {
    player1ScoreElement.textContent = score1;
    player2ScoreElement.textContent = score2;
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制网格线（可选）
    drawGrid();
    
    // 绘制蛇
    drawSnake(snake1);
    drawSnake(snake2);
    
    // 绘制普通食物
    drawFood(food, '#FF0000');
    
    // 绘制特殊食物
    if (specialFood) {
        drawSpecialFood(specialFood);
    }
    
    // 如果游戏暂停，显示暂停文本
    if (gamePaused) {
        drawPauseText();
    }
}

// 绘制网格线
function drawGrid() {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
}

// 绘制蛇
function drawSnake(snake) {
    // 绘制蛇身
    ctx.fillStyle = snake.color;
    for (let i = 1; i < snake.body.length; i++) {
        ctx.fillRect(
            snake.body[i].x * GRID_SIZE,
            snake.body[i].y * GRID_SIZE,
            GRID_SIZE - 1,
            GRID_SIZE - 1
        );
    }
    
    // 绘制蛇头，颜色稍深以区分
    const head = snake.body[0];
    ctx.fillStyle = shadeColor(snake.color, -20);
    ctx.fillRect(
        head.x * GRID_SIZE,
        head.y * GRID_SIZE,
        GRID_SIZE - 1,
        GRID_SIZE - 1
    );
    
    // 绘制眼睛
    ctx.fillStyle = '#FFFFFF';
    const eyeSize = GRID_SIZE / 5;
    const eyeOffsetX = GRID_SIZE / 3;
    const eyeOffsetY = GRID_SIZE / 3;
    
    // 根据方向绘制眼睛位置
    switch (snake.direction) {
        case 'up':
            ctx.beginPath();
            ctx.arc(head.x * GRID_SIZE + eyeOffsetX, head.y * GRID_SIZE + eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * GRID_SIZE + GRID_SIZE - eyeOffsetX, head.y * GRID_SIZE + eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'down':
            ctx.beginPath();
            ctx.arc(head.x * GRID_SIZE + eyeOffsetX, head.y * GRID_SIZE + GRID_SIZE - eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * GRID_SIZE + GRID_SIZE - eyeOffsetX, head.y * GRID_SIZE + GRID_SIZE - eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'left':
            ctx.beginPath();
            ctx.arc(head.x * GRID_SIZE + eyeOffsetX, head.y * GRID_SIZE + eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * GRID_SIZE + eyeOffsetX, head.y * GRID_SIZE + GRID_SIZE - eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'right':
            ctx.beginPath();
            ctx.arc(head.x * GRID_SIZE + GRID_SIZE - eyeOffsetX, head.y * GRID_SIZE + eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(head.x * GRID_SIZE + GRID_SIZE - eyeOffsetX, head.y * GRID_SIZE + GRID_SIZE - eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

// 绘制普通食物
function drawFood(food, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// 绘制特殊食物
function drawSpecialFood(specialFood) {
    // 闪烁效果
    const alpha = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    
    ctx.beginPath();
    ctx.arc(
        specialFood.x * GRID_SIZE + GRID_SIZE / 2,
        specialFood.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 绘制星形标记
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(specialFood.x * GRID_SIZE + GRID_SIZE / 2, specialFood.y * GRID_SIZE + GRID_SIZE / 4);
    ctx.lineTo(specialFood.x * GRID_SIZE + GRID_SIZE * 3/4, specialFood.y * GRID_SIZE + GRID_SIZE * 3/4);
    ctx.lineTo(specialFood.x * GRID_SIZE + GRID_SIZE / 4, specialFood.y * GRID_SIZE + GRID_SIZE * 3/4);
    ctx.lineTo(specialFood.x * GRID_SIZE + GRID_SIZE * 3/4, specialFood.y * GRID_SIZE + GRID_SIZE / 4);
    ctx.stroke();
}

// 绘制暂停文本
function drawPauseText() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.font = '24px Arial';
    ctx.fillText('按空格键继续游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

// 游戏结束
function endGame(collision1, collision2) {
    gameRunning = false;
    clearInterval(gameLoopId);
    
    // 显示游戏结束模态框
    gameOverModal.style.display = 'flex';
    
    // 确定获胜者
    let resultText = '';
    if (collision1 && collision2) {
        if (score1 > score2) {
            resultText = `两位玩家同时碰撞！\n玩家1获胜！\n玩家1得分: ${score1}，玩家2得分: ${score2}`;
        } else if (score2 > score1) {
            resultText = `两位玩家同时碰撞！\n玩家2获胜！\n玩家1得分: ${score1}，玩家2得分: ${score2}`;
        } else {
            resultText = `两位玩家同时碰撞！\n平局！\n得分: ${score1}`;
        }
    } else if (collision1) {
        resultText = `玩家1碰撞！\n玩家2获胜！\n玩家1得分: ${score1}，玩家2得分: ${score2}`;
    } else {
        resultText = `玩家2碰撞！\n玩家1获胜！\n玩家1得分: ${score1}，玩家2得分: ${score2}`;
    }
    
    winnerText.textContent = resultText;
    
    // 更新按钮状态
    startButton.disabled = false;
    pauseButton.disabled = true;
}

// 辅助函数：调整颜色明暗
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

// 初始化游戏
initGame();