/**
 * Tetris Arcade - 遊戲核心引擎與音效合成器
 */

// 經典方塊形狀矩陣
const SHAPES = {
  'I': [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'O': [
    [1, 1],
    [1, 1]
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'S': [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  'J': [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'L': [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

// 霓虹配色系統
const COLORS = {
  'I': '#00f2fe', // 霓虹青
  'O': '#ffd700', // 霓虹黃
  'T': '#9d4edd', // 霓虹紫
  'S': '#39ff14', // 霓虹綠
  'Z': '#ff007f', // 霓虹粉紅
  'J': '#0070f3', // 霓虹深藍
  'L': '#ff8c00'  // 霓虹橙
};

/* ==========================================================================
   Web Audio API 音效合成器 (8-Bit Synth Sound Effects)
   ========================================================================== */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playMove() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playRotate() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
    
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playDrop() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playClear(linesCount) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = linesCount === 4 ? [261.63, 329.63, 392.00, 523.25] : [329.63, 392.00, 523.25]; // Tetris 播放大四和弦
    const duration = 0.12;
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gain.gain.setValueAtTime(0.03, now + index * 0.08);
      gain.gain.setValueAtTime(0.03, now + index * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + duration);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [440, 415.30, 392, 349.23, 293.66, 220]; // 悲傷的降音
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);
      
      gain.gain.setValueAtTime(0.04, now + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.25);
    });
  }

  playPause() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(150, now + 0.1);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

/* ==========================================================================
   俄羅斯方塊遊戲引擎 (Tetris Game Engine)
   ========================================================================== */
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

    // 棋盤尺寸
    this.cols = 10;
    this.rows = 20;
    this.blockSize = 30; // 每個方塊 30x30 像素

    this.grid = [];
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    
    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;

    // 計時器與速度控制
    this.dropCounter = 0;
    this.dropInterval = 1000; // 毫秒
    this.lastTime = 0;
    this.isPaused = false;
    this.isPlaying = false;
    this.animationId = null;

    // 清行動畫控制
    this.clearingRows = [];
    this.isClearingAnimation = false;

    // 方塊袋生成 (7-bag randomizer)
    this.bag = [];

    this.reset();
  }

  // 重置遊戲數據
  reset() {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.dropInterval = 1000;
    
    this.currentPiece = null;
    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.bag = [];
    
    this.isPaused = false;
    this.isPlaying = false;
    this.isClearingAnimation = false;
    this.clearingRows = [];

    this.updateStatsUI();
    this.draw();
    this.drawPreview(this.nextCtx, null);
    this.drawPreview(this.holdCtx, null);
  }

  // 開始遊戲
  start() {
    this.sounds.init();
    if (this.isPlaying && !this.isPaused) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.sounds.playPause();
      this.lastTime = performance.now();
      this.updateLoop();
      return;
    }

    this.reset();
    this.isPlaying = true;
    this.nextPiece = this.generatePiece();
    this.spawnPiece();
    this.lastTime = performance.now();
    this.updateLoop();
  }

  // 暫停遊戲
  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.sounds.playPause();
    cancelAnimationFrame(this.animationId);
    this.draw();
  }

  // 恢復遊戲
  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    this.start();
  }

  // 取得隨方塊形狀 (7-bag 演算法，保證出現均勻度)
  generatePiece() {
    if (this.bag.length === 0) {
      this.bag = Object.keys(SHAPES);
      // 隨機打亂 bag
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    const type = this.bag.pop();
    return {
      type: type,
      matrix: JSON.parse(JSON.stringify(SHAPES[type])),
      color: COLORS[type],
      x: 0,
      y: 0
    };
  }

  // 放置新方塊
  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.generatePiece();
    
    // 初始化方塊位置至頂部中央
    this.currentPiece.x = Math.floor((this.cols - this.currentPiece.matrix[0].length) / 2);
    this.currentPiece.y = this.currentPiece.type === 'I' ? -1 : 0; // 'I'方塊初始上移一格

    this.canHold = true;

    // 碰撞檢查：如果一產生就碰撞，代表 Game Over
    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver();
    }

    this.drawPreview(this.nextCtx, this.nextPiece);
    this.drawPreview(this.holdCtx, this.holdPiece);
  }

  // 暫存方塊 (Hold Piece)
  hold() {
    if (!this.isPlaying || this.isPaused || !this.canHold) return;

    this.sounds.playRotate();
    const currentType = this.currentPiece.type;

    if (this.holdPiece === null) {
      // 第一次暫存
      this.holdPiece = {
        type: currentType,
        matrix: JSON.parse(JSON.stringify(SHAPES[currentType])),
        color: COLORS[currentType]
      };
      this.spawnPiece();
    } else {
      // 交換暫存方塊與當前方塊
      const temp = this.holdPiece;
      this.holdPiece = {
        type: currentType,
        matrix: JSON.parse(JSON.stringify(SHAPES[currentType])),
        color: COLORS[currentType]
      };
      
      this.currentPiece = {
        type: temp.type,
        matrix: JSON.parse(JSON.stringify(SHAPES[temp.type])),
        color: temp.color,
        x: Math.floor((this.cols - temp.matrix[0].length) / 2),
        y: temp.type === 'I' ? -1 : 0
      };
    }

    this.canHold = false;
    this.drawPreview(this.holdCtx, this.holdPiece);
    this.drawPreview(this.nextCtx, this.nextPiece);
  }

  // 碰撞偵測
  checkCollision(piece, offsetLeft, offsetTop, customMatrix = null) {
    const matrix = customMatrix || piece.matrix;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetX = piece.x + c + offsetLeft;
          const targetY = piece.y + r + offsetTop;

          // 邊界檢查
          if (targetX < 0 || targetX >= this.cols || targetY >= this.rows) {
            return true;
          }

          // 地圖固定方塊檢查 (忽略頂部邊界)
          if (targetY >= 0 && this.grid[targetY][targetX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // 往左移動
  moveLeft() {
    if (!this.isPlaying || this.isPaused) return;
    if (!this.checkCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      this.sounds.playMove();
    }
  }

  // 往右移動
  moveRight() {
    if (!this.isPlaying || this.isPaused) return;
    if (!this.checkCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      this.sounds.playMove();
    }
  }

  // 旋轉方塊並執行 Wall Kick 演算法
  rotate() {
    if (!this.isPlaying || this.isPaused || this.currentPiece.type === 'O') return;

    const matrix = this.currentPiece.matrix;
    const size = matrix.length;
    
    // 建立旋轉後的新矩陣 (順時針旋轉 90 度)
    const rotatedMatrix = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        rotatedMatrix[c][size - 1 - r] = matrix[r][c];
      }
    }

    // Wall Kick 排擠演算法：檢查旋轉後是否碰撞，若碰撞則嘗試向左、右、上、下微調
    // 依序嘗試位移：原位(0,0) -> 左移1(-1,0) -> 右移1(1,0) -> 下移1(0,1) -> 上移1(0,-1)
    const kickOffsets = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [-2, 0],
      [2, 0]
    ];

    for (let i = 0; i < kickOffsets.length; i++) {
      const [offsetX, offsetY] = kickOffsets[i];
      if (!this.checkCollision(this.currentPiece, offsetX, offsetY, rotatedMatrix)) {
        this.currentPiece.matrix = rotatedMatrix;
        this.currentPiece.x += offsetX;
        this.currentPiece.y += offsetY;
        this.sounds.playRotate();
        return;
      }
    }
  }

  // 軟降 (向下加速一格)
  softDrop() {
    if (!this.isPlaying || this.isPaused) return;
    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.score += 1; // 軟降得分
      this.updateStatsUI();
      this.dropCounter = 0; // 重置自然下落計時
    } else {
      this.lockPiece();
    }
  }

  // 硬降 (直接墜落到底部)
  hardDrop() {
    if (!this.isPlaying || this.isPaused) return;
    let dropRows = 0;
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      dropRows++;
    }
    this.score += dropRows * 2; // 硬降雙倍得分
    this.sounds.playDrop();
    this.lockPiece();
    this.updateStatsUI();
  }

  // 鎖定方塊並檢測消行
  lockPiece() {
    const matrix = this.currentPiece.matrix;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetY = this.currentPiece.y + r;
          const targetX = this.currentPiece.x + c;
          
          if (targetY >= 0) {
            this.grid[targetY][targetX] = this.currentPiece.color;
          } else {
            // 方塊在螢幕外鎖定，觸發 Game Over
            this.gameOver();
            return;
          }
        }
      }
    }

    this.checkLines();
  }

  // 檢測消行並執行消行動畫
  checkLines() {
    this.clearingRows = [];
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) {
        this.clearingRows.push(r);
      }
    }

    if (this.clearingRows.length > 0) {
      // 觸發消行動畫 (閃爍發光)
      this.isClearingAnimation = true;
      this.sounds.playClear(this.clearingRows.length);
      
      setTimeout(() => {
        // 動畫結束後，從底往上移除被消除的列，並在頂部補上空列
        this.clearingRows.forEach(rowIndex => {
          this.grid.splice(rowIndex, 1);
          this.grid.unshift(Array(this.cols).fill(0));
        });

        // 根據消行數加權計分 (1: 100, 2: 300, 3: 500, 4: 800) * Level
        const baseScores = [0, 100, 300, 500, 800];
        this.score += baseScores[this.clearingRows.length] * this.level;
        this.lines += this.clearingRows.length;
        
        // 等級提升 (每滿 10 行提升一級，並調快速度)
        const nextLevel = Math.floor(this.lines / 10) + 1;
        if (nextLevel > this.level) {
          this.level = nextLevel;
          // 速度調整公式：每上升一級，自然下落間隔縮短 80ms (最小 100ms)
          this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 80);
        }

        this.isClearingAnimation = false;
        this.clearingRows = [];
        this.updateStatsUI();
        this.spawnPiece();
      }, 200); // 閃爍動畫持續 200 毫秒
    } else {
      this.spawnPiece();
    }
  }

  // 遊戲結束
  gameOver() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    this.sounds.playGameOver();
    if (this.onGameOver) {
      this.onGameOver(this.score, this.lines);
    }
  }

  // 計算影子方塊落地位置 (Ghost Piece)
  getGhostY() {
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  /* ==========================================================================
     視覺渲染邏輯 (Drawing & Render Loop)
     ========================================================================== */
  updateLoop(time = 0) {
    if (!this.isPlaying || this.isPaused) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    // 當不是消行動畫期間時，進行正常下落計時
    if (!this.isClearingAnimation) {
      this.dropCounter += deltaTime;
      if (this.dropCounter >= this.dropInterval) {
        this.softDrop();
        this.dropCounter = 0;
      }
    }

    this.draw();
    this.animationId = requestAnimationFrame((t) => this.updateLoop(t));
  }

  // 主渲染函數
  draw() {
    // 清空 Canvas
    this.ctx.fillStyle = '#030305';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 繪製背景格線 (Grid Lines)
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

    // 繪製地圖上已固定的方塊
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0) {
          // 檢查此列是否正處於消行動畫中
          if (this.isClearingAnimation && this.clearingRows.includes(r)) {
            this.drawBlock(this.ctx, c, r, '#ffffff', true); // 清行動畫顯示白色高亮
          } else {
            this.drawBlock(this.ctx, c, r, this.grid[r][c]);
          }
        }
      }
    }

    // 繪製運行中的方塊與影子方塊
    if (this.isPlaying && this.currentPiece) {
      const ghostY = this.getGhostY();

      // 1. 繪製影子預覽方塊 (Ghost Piece) - 僅虛線與半透明
      this.drawPiece(this.ctx, this.currentPiece, 0, ghostY - this.currentPiece.y, true);

      // 2. 繪製當前方塊 (Current Piece)
      this.drawPiece(this.ctx, this.currentPiece);
    }
  }

  // 繪製整組方塊
  drawPiece(context, piece, offsetX = 0, offsetY = 0, isGhost = false) {
    const matrix = piece.matrix;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          this.drawBlock(
            context,
            piece.x + c + offsetX,
            piece.y + r + offsetY,
            piece.color,
            false,
            isGhost
          );
        }
      }
    }
  }

  // 繪製單個方格
  drawBlock(context, x, y, color, isHighLight = false, isGhost = false) {
    // 忽略天花板之外的繪製
    if (y < 0) return;

    const px = x * this.blockSize;
    const py = y * this.blockSize;
    const pad = 2;
    const size = this.blockSize - pad * 2;

    if (isGhost) {
      // 影子方塊：只畫霓虹外框與半透明背景
      context.fillStyle = 'rgba(255, 255, 255, 0.05)';
      context.fillRect(px + pad, py + pad, size, size);
      
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.strokeRect(px + pad + 1, py + pad + 1, size - 2, size - 2);
    } else {
      // 一般方塊或消除高亮方塊
      context.fillStyle = color;
      
      // Canvas 霓虹發光陰影 (會消耗效能，因此限制僅在 Canvas 上局部渲染)
      if (isHighLight) {
        context.shadowColor = '#ffffff';
        context.shadowBlur = 10;
        context.fillStyle = '#ffffff';
      } else {
        context.shadowColor = color;
        context.shadowBlur = 4;
      }
      
      // 繪製圓角方格 (圓角細節讓畫面更顯高級)
      this.drawRoundedRect(context, px + pad, py + pad, size, size, 4);
      context.fill();
      
      // 重置發光設定，避免影響後續渲染效能
      context.shadowBlur = 0;

      // 繪製頂部微反光白邊 (街機玻璃立體質感)
      context.fillStyle = 'rgba(255, 255, 255, 0.15)';
      context.fillRect(px + pad + 2, py + pad + 2, size - 4, 3);
    }
  }

  // 輔助繪製圓角矩形
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

  // 繪製 Hold 與 Next 預覽面板 (120x120 畫布)
  drawPreview(ctx, piece) {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, 120, 120);

    if (!piece) return;

    const matrix = piece.matrix;
    const size = matrix.length;
    const cellPixel = 22; // 預覽視窗方格略小
    
    // 計算置中偏移
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

          // 街機立體光澤
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(px + pad + 1.5, py + pad + 1.5, s - 3, 2);
        }
      }
    }
  }

  // 更新網頁統計數據
  updateStatsUI() {
    document.getElementById('score-val').textContent = String(this.score).padStart(6, '0');
    document.getElementById('level-val').textContent = this.level;
    document.getElementById('lines-val').textContent = this.lines;
  }
}
