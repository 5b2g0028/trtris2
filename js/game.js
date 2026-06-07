/**
 * Tetris Arcade - 進階穩定版
 * 新增：Lock Delay、Next Queue(內部 5 顆)、Combo、Perfect Clear、本機最高分
 */

const SHAPES = {
  'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  'O': [[1,1],[1,1]],
  'T': [[0,1,0],[1,1,1],[0,0,0]],
  'S': [[0,1,1],[1,1,0],[0,0,0]],
  'Z': [[1,1,0],[0,1,1],[0,0,0]],
  'J': [[1,0,0],[1,1,1],[0,0,0]],
  'L': [[0,0,1],[1,1,1],[0,0,0]]
};

const COLORS = {
  'I': '#00f2fe',
  'O': '#ffd700',
  'T': '#9d4edd',
  'S': '#39ff14',
  'Z': '#ff007f',
  'J': '#0070f3',
  'L': '#ff8c00'
};

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration = 0.08, type = 'triangle', volume = 0.04, delay = 0) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playMove() { this.tone(180, 0.06, 'triangle', 0.04); }
  playRotate() { this.tone(280, 0.08, 'triangle', 0.04); }
  playDrop() { this.tone(120, 0.10, 'sine', 0.08); }
  playPause() { this.tone(300, 0.20, 'triangle', 0.05); }

  playClear(linesCount) {
    const notes = linesCount === 4 ? [261.63, 329.63, 392.00, 523.25] : [329.63, 392.00, 523.25];
    notes.forEach((freq, i) => this.tone(freq, 0.12, 'square', 0.035, i * 0.08));
  }

  playGameOver() {
    [440, 415.30, 392, 349.23, 293.66, 220].forEach((freq, i) => {
      this.tone(freq, 0.25, 'sawtooth', 0.04, i * 0.15);
    });
  }
}

class TetrisGame {
  constructor(canvasId, holdCanvasId, nextCanvasId, onGameOverCallback) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.holdCanvas = document.getElementById(holdCanvasId);
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCanvas = document.getElementById(nextCanvasId);
    this.nextCtx = this.nextCanvas.getContext('2d');

    this.onGameOver = onGameOverCallback;
    this.sounds = new SoundEffects();

    this.cols = 10;
    this.rows = 20;
    this.blockSize = 30;

    this.highScoreKey = 'tetrisArcadeHighScore';
    this.highScore = Number(localStorage.getItem(this.highScoreKey) || 0);

    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.lastClearText = '';

    this.currentPiece = null;
    this.nextPiece = null;
    this.nextQueue = [];
    this.holdPiece = null;
    this.canHold = true;
    this.bag = [];

    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.lockDelay = 450;
    this.lockCounter = 0;
    this.lockResetCount = 0;
    this.maxLockResets = 15;

    this.isPaused = false;
    this.isPlaying = false;
    this.animationId = null;
    this.clearingRows = [];
    this.isClearingAnimation = false;

    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.updateStatsUI();
    this.draw();
    this.drawPreview(this.nextCtx, null);
    this.drawPreview(this.holdCtx, null);
  }

  start() {
    this.sounds.init();
    if (this.isPlaying && !this.isPaused) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.sounds.playPause();
      this.lastTime = performance.now();
      this.updateLoop(this.lastTime);
      return;
    }

    this.reset();
    this.isPlaying = true;
    this.fillNextQueue();
    this.spawnPiece();
    this.lastTime = performance.now();
    this.updateLoop(this.lastTime);
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.sounds.playPause();
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.draw();
  }

  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    this.start();
  }

  fillNextQueue() {
    while (this.nextQueue.length < 5) this.nextQueue.push(this.generatePiece());
    this.nextPiece = this.nextQueue[0] || null;
  }

  generatePiece() {
    if (this.bag.length === 0) {
      this.bag = Object.keys(SHAPES);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }

    const type = this.bag.pop();
    return {
      type,
      matrix: JSON.parse(JSON.stringify(SHAPES[type])),
      color: COLORS[type],
      x: 0,
      y: 0
    };
  }

  resetPiecePosition(piece) {
    piece.x = Math.floor((this.cols - piece.matrix[0].length) / 2);
    piece.y = piece.type === 'I' ? -1 : 0;
  }

  spawnPiece() {
    this.fillNextQueue();
    this.currentPiece = this.nextQueue.shift();
    this.fillNextQueue();
    this.nextPiece = this.nextQueue[0];
    this.resetPiecePosition(this.currentPiece);

    this.canHold = true;
    this.lockCounter = 0;
    this.lockResetCount = 0;
    this.dropCounter = 0;

    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver();
      return;
    }

    this.drawPreview(this.nextCtx, this.nextPiece);
    this.drawPreview(this.holdCtx, this.holdPiece);
  }

  hold() {
    if (!this.isPlaying || this.isPaused || this.isClearingAnimation || !this.currentPiece || !this.canHold) return;

    this.sounds.playRotate();
    const currentType = this.currentPiece.type;

    if (this.holdPiece === null) {
      this.holdPiece = this.createPieceByType(currentType);
      this.spawnPiece();
    } else {
      const temp = this.holdPiece;
      this.holdPiece = this.createPieceByType(currentType);
      this.currentPiece = this.createPieceByType(temp.type);
      this.resetPiecePosition(this.currentPiece);

      if (this.checkCollision(this.currentPiece, 0, 0)) {
        this.gameOver();
        return;
      }
    }

    this.canHold = false;
    this.lockCounter = 0;
    this.lockResetCount = 0;
    this.drawPreview(this.holdCtx, this.holdPiece);
    this.drawPreview(this.nextCtx, this.nextPiece);
  }

  createPieceByType(type) {
    return {
      type,
      matrix: JSON.parse(JSON.stringify(SHAPES[type])),
      color: COLORS[type],
      x: 0,
      y: 0
    };
  }

  checkCollision(piece, offsetLeft, offsetTop, customMatrix = null) {
    if (!piece) return true;
    const matrix = customMatrix || piece.matrix;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetX = piece.x + c + offsetLeft;
          const targetY = piece.y + r + offsetTop;

          if (targetX < 0 || targetX >= this.cols || targetY >= this.rows) return true;
          if (targetY >= 0 && this.grid[targetY][targetX] !== 0) return true;
        }
      }
    }
    return false;
  }

  resetLockDelayByMove() {
    if (this.checkCollision(this.currentPiece, 0, 1) && this.lockResetCount < this.maxLockResets) {
      this.lockCounter = 0;
      this.lockResetCount++;
    }
  }

  moveLeft() {
    if (!this.isPlaying || this.isPaused || this.isClearingAnimation || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      this.resetLockDelayByMove();
      this.sounds.playMove();
    }
  }

  moveRight() {
    if (!this.isPlaying || this.isPaused || this.isClearingAnimation || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      this.resetLockDelayByMove();
      this.sounds.playMove();
    }
  }

  rotate() {
    if (!this.isPlaying || this.isPaused || this.isClearingAnimation || !this.currentPiece || this.currentPiece.type === 'O') return;

    const matrix = this.currentPiece.matrix;
    const size = matrix.length;
    const rotatedMatrix = Array.from({ length: size }, () => Array(size).fill(0));

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        rotatedMatrix[c][size - 1 - r] = matrix[r][c];
      }
    }

    const kickOffsets = this.currentPiece.type === 'I'
      ? [[0,0],[-2,0],[1,0],[-2,-1],[1,2],[-1,0],[2,0]]
      : [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1],[-2,0],[2,0]];

    for (const [offsetX, offsetY] of kickOffsets) {
      if (!this.checkCollision(this.currentPiece, offsetX, offsetY, rotatedMatrix)) {
        this.currentPiece.matrix = rotatedMatrix;
        this.currentPiece.x += offsetX;
        this.currentPiece.y += offsetY;
        this.resetLockDelayByMove();
        this.sounds.playRotate();
        return;
      }
    }
  }

  softDrop() {
    if (!this.isPlaying || this.isPaused || this.isClearingAnimation || !this.currentPiece) return;

    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.score += 1;
      this.lockCounter = 0;
      this.dropCounter = 0;
      this.updateStatsUI();
    } else {
      // 進階版：碰到底不立刻鎖死，交給 Lock Delay。
      this.lockCounter = Math.min(this.lockCounter + 60, this.lockDelay);
    }
  }

  hardDrop() {
    if (!this.isPlaying || this.isPaused || this.isClearingAnimation || !this.currentPiece) return;

    let dropRows = 0;
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      dropRows++;
    }

    this.score += dropRows * 2;
    this.sounds.playDrop();
    this.lockPiece();
    this.updateStatsUI();
  }

  lockPiece() {
    if (!this.currentPiece) return;

    const piece = this.currentPiece;
    const matrix = piece.matrix;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetY = piece.y + r;
          const targetX = piece.x + c;

          if (targetY >= 0) {
            if (targetY < this.rows && targetX >= 0 && targetX < this.cols) {
              this.grid[targetY][targetX] = piece.color;
            }
          } else {
            this.gameOver();
            return;
          }
        }
      }
    }

    this.currentPiece = null;
    this.lockCounter = 0;
    this.lockResetCount = 0;
    this.checkLines();
  }

  checkLines() {
    this.clearingRows = [];

    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) this.clearingRows.push(r);
    }

    if (this.clearingRows.length > 0) {
      this.isClearingAnimation = true;
      this.sounds.playClear(this.clearingRows.length);

      setTimeout(() => {
        const clearedCount = this.clearingRows.length;

        this.clearingRows
          .slice()
          .sort((a, b) => b - a)
          .forEach(rowIndex => this.grid.splice(rowIndex, 1));

        for (let i = 0; i < clearedCount; i++) {
          this.grid.unshift(Array(this.cols).fill(0));
        }

        this.applyClearScore(clearedCount);

        this.isClearingAnimation = false;
        this.clearingRows = [];
        this.updateStatsUI();

        if (this.isPlaying) this.spawnPiece();
      }, 200);
    } else {
      this.combo = -1;
      this.lastClearText = '';
      this.updateStatsUI();
      if (this.isPlaying) this.spawnPiece();
    }
  }

  applyClearScore(clearedCount) {
    const baseScores = [0, 100, 300, 500, 800];
    this.combo++;

    const comboBonus = this.combo > 0 ? this.combo * 50 * this.level : 0;
    let gained = (baseScores[clearedCount] || 0) * this.level + comboBonus;

    const perfectClear = this.grid.every(row => row.every(cell => cell === 0));
    if (perfectClear) gained += 2000 * this.level;

    this.score += gained;
    this.lines += clearedCount;

    if (clearedCount === 4) this.lastClearText = 'TETRIS!';
    else this.lastClearText = `${clearedCount} LINE${clearedCount > 1 ? 'S' : ''}`;
    if (this.combo > 0) this.lastClearText += `  COMBO x${this.combo}`;
    if (perfectClear) this.lastClearText += '  PERFECT CLEAR!';

    const nextLevel = Math.floor(this.lines / 10) + 1;
    if (nextLevel > this.level) {
      this.level = nextLevel;
      this.dropInterval = Math.max(80, Math.floor(1000 * Math.pow(0.85, this.level - 1)));
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(this.highScoreKey, String(this.highScore));
    }
  }

  gameOver() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPiece = null;

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(this.highScoreKey, String(this.highScore));
    }

    this.sounds.playGameOver();
    this.updateStatsUI();
    this.draw();

    if (this.onGameOver) this.onGameOver(this.score, this.lines);
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) ghostY++;
    return ghostY;
  }

  updateLoop(time = 0) {
    if (!this.isPlaying || this.isPaused) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (!this.isClearingAnimation && this.currentPiece) {
      if (this.checkCollision(this.currentPiece, 0, 1)) {
        this.lockCounter += deltaTime;
        if (this.lockCounter >= this.lockDelay) this.lockPiece();
      } else {
        this.lockCounter = 0;
        this.dropCounter += deltaTime;
        if (this.dropCounter >= this.dropInterval) {
          this.currentPiece.y++;
          this.dropCounter = 0;
        }
      }
    }

    this.draw();
    this.animationId = requestAnimationFrame(t => this.updateLoop(t));
  }

  draw() {
    this.ctx.fillStyle = '#030305';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.blockSize, 0);
      this.ctx.lineTo(c * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.blockSize);
      this.ctx.lineTo(this.canvas.width, r * this.blockSize);
      this.ctx.stroke();
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0) {
          if (this.isClearingAnimation && this.clearingRows.includes(r)) {
            this.drawBlock(this.ctx, c, r, '#ffffff', true);
          } else {
            this.drawBlock(this.ctx, c, r, this.grid[r][c]);
          }
        }
      }
    }

    if (this.isPlaying && this.currentPiece) {
      const ghostY = this.getGhostY();
      this.drawPiece(this.ctx, this.currentPiece, 0, ghostY - this.currentPiece.y, true);
      this.drawPiece(this.ctx, this.currentPiece);
    }

    this.drawOverlayText();
  }

  drawOverlayText() {
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 24px Arial';

    if (this.lastClearText && this.isPlaying) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
      this.ctx.shadowColor = '#00f2fe';
      this.ctx.shadowBlur = 12;
      this.ctx.fillText(this.lastClearText, this.canvas.width / 2, 70);
      this.ctx.shadowBlur = 0;
    }

    if (this.isPaused) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }

    if (!this.isPlaying && this.score > 0) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 18);
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Press Start to retry', this.canvas.width / 2, this.canvas.height / 2 + 18);
    }

    this.ctx.restore();
  }

  drawPiece(context, piece, offsetX = 0, offsetY = 0, isGhost = false) {
    if (!piece) return;
    const matrix = piece.matrix;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          this.drawBlock(context, piece.x + c + offsetX, piece.y + r + offsetY, piece.color, false, isGhost);
        }
      }
    }
  }

  drawBlock(context, x, y, color, isHighLight = false, isGhost = false) {
    if (y < 0) return;

    const px = x * this.blockSize;
    const py = y * this.blockSize;
    const pad = 2;
    const size = this.blockSize - pad * 2;

    if (isGhost) {
      context.fillStyle = 'rgba(255, 255, 255, 0.05)';
      context.fillRect(px + pad, py + pad, size, size);
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.strokeRect(px + pad + 1, py + pad + 1, size - 2, size - 2);
      return;
    }

    context.fillStyle = isHighLight ? '#ffffff' : color;
    context.shadowColor = isHighLight ? '#ffffff' : color;
    context.shadowBlur = isHighLight ? 10 : 4;
    this.drawRoundedRect(context, px + pad, py + pad, size, size, 4);
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = 'rgba(255, 255, 255, 0.15)';
    context.fillRect(px + pad + 2, py + pad + 2, size - 4, 3);
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawPreview(ctx, piece) {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, 120, 120);
    if (!piece) return;

    const matrix = piece.matrix;
    const size = matrix.length;
    const cellPixel = 22;
    const offsetX = (120 - size * cellPixel) / 2;
    const offsetY = (120 - size * cellPixel) / 2;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] !== 0) {
          const px = offsetX + c * cellPixel;
          const py = offsetY + r * cellPixel;
          const pad = 1.5;
          const s = cellPixel - pad * 2;

          ctx.fillStyle = piece.color;
          ctx.shadowColor = piece.color;
          ctx.shadowBlur = 4;
          this.drawRoundedRect(ctx, px + pad, py + pad, s, s, 3);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(px + pad + 1.5, py + pad + 1.5, s - 3, 2);
        }
      }
    }
  }

  updateStatsUI() {
    const scoreEl = document.getElementById('score-val');
    const levelEl = document.getElementById('level-val');
    const linesEl = document.getElementById('lines-val');
    const highScoreEl = document.getElementById('high-score-val');
    const comboEl = document.getElementById('combo-val');

    if (scoreEl) scoreEl.textContent = String(this.score).padStart(6, '0');
    if (levelEl) levelEl.textContent = this.level;
    if (linesEl) linesEl.textContent = this.lines;
    if (highScoreEl) highScoreEl.textContent = String(this.highScore).padStart(6, '0');
    if (comboEl) comboEl.textContent = this.combo > 0 ? `x${this.combo}` : '-';
  }
}
