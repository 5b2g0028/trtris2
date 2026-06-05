/**
 * Tetris Arcade - UI Controller & Event Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  let game = null;

  /* ==========================================================================
     1. SPA Tab 切換邏輯 (SPA Tab Switching)
     ========================================================================== */
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewSections = document.querySelectorAll('.view-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetViewId = btn.getAttribute('data-target');
      
      // 切換按鈕 active 樣式
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 切換檢視區塊 active 樣式
      viewSections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(targetViewId).classList.add('active');

      // 若切換到排行榜，自動重新載入排行榜
      if (targetViewId === 'leaderboard-view') {
        loadLeaderboard();
      }

      // 如果切換到別的分頁且遊戲正在運行，自動暫存暫停
      if (targetViewId !== 'game-view' && game && game.isPlaying && !game.isPaused) {
        pauseGame();
      }
    });
  });

  /* ==========================================================================
     2. 俄羅斯方塊實例初始化與按鈕綁定 (Game Initialization & Button Binds)
     ========================================================================== */
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const soundBtn = document.getElementById('sound-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const pauseOverlay = document.getElementById('pause-overlay');

  // 初始化遊戲實例
  game = new TetrisGame('game-canvas', 'hold-canvas', 'next-canvas', handleGameOver);

  // 開始按鈕
  startBtn.addEventListener('click', () => {
    if (game.isPlaying && !game.isPaused) return;
    
    // 如果是從暫停中點擊
    if (game.isPaused) {
      resumeGame();
    } else {
      game.start();
      startBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i> 遊戲中...';
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停';
    }
    // 聚焦畫布以方便操作
    game.canvas.focus();
  });

  // 暫停按鈕
  pauseBtn.addEventListener('click', () => {
    if (game.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  });

  // 暫停遮罩上的繼續按鈕
  resumeBtn.addEventListener('click', resumeGame);

  // 重置按鈕
  resetBtn.addEventListener('click', () => {
    if (confirm('確定要放棄當前遊戲進度，重新開始嗎？')) {
      game.reset();
      startBtn.innerHTML = '<i class="fa-solid fa-play"></i> 開始遊戲';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      pauseOverlay.classList.remove('active');
    }
  });

  // 音效開關按鈕
  soundBtn.addEventListener('click', () => {
    const isMuted = game.sounds.toggleMute();
    if (isMuted) {
      soundBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      soundBtn.style.color = 'var(--text-muted)';
      soundBtn.style.borderColor = 'rgba(255,255,255,0.05)';
    } else {
      soundBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      soundBtn.style.color = 'var(--neon-cyan)';
      soundBtn.style.borderColor = 'var(--neon-cyan)';
      // 播一個短音效讓玩家知道音效打開了
      game.sounds.playRotate();
    }
  });

  // 暫停遊戲函數
  function pauseGame() {
    game.pause();
    pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> 繼續';
    pauseOverlay.classList.add('active');
  }

  // 恢復遊戲函數
  function resumeGame() {
    game.resume();
    pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停';
    pauseOverlay.classList.remove('active');
    game.canvas.focus();
  }

  /* ==========================================================================
     3. 鍵盤事件綁定 (Keyboard Controls)
     ========================================================================== */
  window.addEventListener('keydown', (e) => {
    // 當彈窗打開時，停用遊戲控制
    if (document.getElementById('game-over-modal').classList.contains('active')) {
      return;
    }

    // 只在遊戲視圖中接收按鍵
    if (!document.getElementById('game-view').classList.contains('active')) {
      return;
    }

    if (!game.isPlaying) return;

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        game.moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        game.moveRight();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        game.rotate();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        game.softDrop();
        break;
      case ' ':
        e.preventDefault(); // 防止空白鍵滾動網頁
        game.hardDrop();
        break;
      case 'Shift':
      case 'c':
      case 'C':
        e.preventDefault();
        game.hold();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        if (game.isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
        break;
    }
  });

  /* ==========================================================================
     4. 行動端虛擬按鈕綁定 (Mobile Touch Controls)
     ========================================================================== */
  const addTouchListener = (btnId, callback) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    // 綁定 touchstart 以確保在行動裝置低延遲回應
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      callback();
    });
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      // 在案頭端也支援點擊測試
      if ('ontouchstart' in window === false) {
        callback();
      }
    });
  };

  addTouchListener('btn-left', () => game.moveLeft());
  addTouchListener('btn-right', () => game.moveRight());
  addTouchListener('btn-rotate', () => game.rotate());
  addTouchListener('btn-down', () => game.softDrop());
  addTouchListener('btn-hold', () => game.hold());
  addTouchListener('btn-drop', () => game.hardDrop());

  /* ==========================================================================
     5. 排行榜載入與渲染 (Load and Render Leaderboard)
     ========================================================================== */
  const leaderboardTbody = document.getElementById('leaderboard-tbody');
  const dbConnectionType = document.getElementById('db-connection-type');
  const dbStatusBadge = document.getElementById('db-status-badge');
  const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard');

  async function loadLeaderboard() {
    leaderboardTbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center loading-text">
          <i class="fa-solid fa-spinner fa-spin"></i> 排行榜載入中...
        </td>
      </tr>
    `;

    const result = await API.getLeaderboard(10);

    // 更新資料庫連接狀態 UI
    updateDbStatusUI(result.isMongo, result.dbStatus);

    if (!result.success && (!result.data || result.data.length === 0)) {
      leaderboardTbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-red" style="color: var(--neon-pink); padding: 2rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> 無法獲取排行榜數據，後端伺服器未啟動或資料庫故障。
          </td>
        </tr>
      `;
      return;
    }

    const scores = result.data || [];
    if (scores.length === 0) {
      leaderboardTbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center loading-text">
            🎮 暫無挑戰紀錄！快去開始第一局遊戲吧！
          </td>
        </tr>
      `;
      return;
    }

    // 渲染排行榜表格
    leaderboardTbody.innerHTML = scores.map((item, index) => {
      const formattedDate = item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';
      
      return `
        <tr>
          <td><span class="rank-badge">${index + 1}</span></td>
          <td>${escapeHTML(item.username)}</td>
          <td class="font-orbitron" style="font-weight: 700; color: var(--neon-cyan);">${item.score.toLocaleString()}</td>
          <td class="font-orbitron">${item.linesCleared || 0}</td>
        </tr>
      `;
    }).join('');
  }

  // 輔助防 XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // 更新 DB 狀態徽章與文字
  function updateDbStatusUI(isMongo, statusText) {
    if (!statusText || statusText === 'Disconnected' || statusText === 'Initializing...') {
      dbConnectionType.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--neon-pink)"></i> 連線狀態: 離線 (僅前端單機)`;
      dbStatusBadge.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: var(--neon-pink)"></i> <span>Offline</span>`;
      dbStatusBadge.className = 'db-status-badge';
      return;
    }

    dbConnectionType.innerHTML = `<i class="fa-solid fa-network-wired"></i> 連線狀態: ${statusText}`;
    
    dbStatusBadge.innerHTML = `<i class="fa-solid fa-database"></i> <span>${isMongo ? 'Cloud DB' : 'Local DB'}</span>`;
    dbStatusBadge.className = isMongo 
      ? 'db-status-badge connected-mongo' 
      : 'db-status-badge connected-local';
  }

  // 排行榜手動刷新按鈕
  refreshLeaderboardBtn.addEventListener('click', loadLeaderboard);

  // 網頁開啟時先偵測一次連線狀態
  (async () => {
    const result = await API.getLeaderboard(1);
    updateDbStatusUI(result.isMongo, result.dbStatus);
  })();

  /* ==========================================================================
     6. Game Over 彈窗與成績提交 (Game Over Modal & Post)
     ========================================================================== */
  const gameOverModal = document.getElementById('game-over-modal');
  const modalScore = document.getElementById('modal-score');
  const modalLines = document.getElementById('modal-lines');
  const usernameInput = document.getElementById('username-input');
  const charCounter = document.getElementById('char-counter');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalErrorMsg = document.getElementById('modal-error-msg');

  let lastScore = 0;
  let lastLines = 0;

  // 遊戲引擎呼叫之 Game Over 回呼
  function handleGameOver(score, lines) {
    lastScore = score;
    lastLines = lines;

    modalScore.textContent = score.toLocaleString();
    modalLines.textContent = lines;
    usernameInput.value = '';
    charCounter.textContent = '0/10';
    modalErrorMsg.textContent = '';
    
    // 開啟彈窗
    gameOverModal.classList.add('active');
    
    // 更新主畫面控制按鈕
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> 開始遊戲';
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    // 自動聚焦輸入框
    setTimeout(() => usernameInput.focus(), 100);
  }

  // 暱稱字元計算與限縮
  usernameInput.addEventListener('input', () => {
    const text = usernameInput.value;
    charCounter.textContent = `${text.length}/10`;
    if (text.length > 0) {
      modalErrorMsg.textContent = '';
    }
  });

  // 關閉彈窗 (放棄成績)
  modalCloseBtn.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
  });

  // 提交成績
  submitScoreBtn.addEventListener('click', submitScore);
  
  // 支援輸入框 Enter 提交
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitScore();
    }
  });

  async function submitScore() {
    const username = usernameInput.value.trim();

    // 前端防呆與校驗
    if (username.length === 0) {
      modalErrorMsg.textContent = '❌ 請輸入暱稱以記錄您的高分！';
      usernameInput.focus();
      return;
    }

    if (username.length > 10) {
      modalErrorMsg.textContent = '❌ 暱稱長度不能超過 10 個字元。';
      return;
    }

    submitScoreBtn.disabled = true;
    submitScoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 上傳中...';

    const result = await API.submitScore(username, lastScore, lastLines);

    if (result.success) {
      // 關閉彈窗
      gameOverModal.classList.remove('active');
      submitScoreBtn.disabled = false;
      submitScoreBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 送出成績';
      
      // 自動切換到排行榜頁面
      document.getElementById('nav-leaderboard-btn').click();
    } else {
      modalErrorMsg.textContent = `❌ 錯誤: ${result.message}`;
      submitScoreBtn.disabled = false;
      submitScoreBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 送出成績';
    }
  }
});
