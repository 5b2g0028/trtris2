/**
 * Tetris Arcade - API Client Module
 */
const API_BASE = 'https://tetris-backend-jaym.onrender.com/api/scores';

const API = {
  /**
   * 取得排行榜資料
   * @param {number} limit 取得筆數限制 (預設 10)
   * @returns {Promise<object>} 排行榜與資料庫狀態資料
   */
  async getLeaderboard(limit = 10) {
    try {
      const response = await fetch(`${API_BASE}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        success: false,
        message: error.message || '無法連線至 API 伺服器。',
        data: [],
        dbStatus: 'Disconnected'
      };
    }
  },

  /**
   * 提交玩家分數至排行榜
   * @param {string} username 玩家暱稱 (限制 10 字元)
   * @param {number} score 分數
   * @param {number} linesCleared 消除行數
   * @returns {Promise<object>} 提交結果
   */
  async submitScore(username, score, linesCleared) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, score, linesCleared })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
      return result;
    } catch (error) {
      console.error('Error submitting score:', error);
      return {
        success: false,
        message: error.message || '送出成績時連線失敗，請檢查網路連線。'
      };
    }
  }
};
