/**
 * Popup 脚本
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const wordlistCount = document.getElementById('wordlistCount');

  // 加载当前状态
  chrome.storage.local.get(['isEnabled', 'wordlist'], (result) => {
    // 更新开关状态
    toggle.checked = result.isEnabled || false;
    updateStatusText(result.isEnabled || false);

    // 更新单词表数量
    if (result.wordlist) {
      wordlistCount.textContent = `${Object.keys(result.wordlist).length} 个词汇`;
    } else {
      wordlistCount.textContent = '加载中...';
      // 异步加载单词表
      loadWordlistCount();
    }
  });

  // 监听开关变化
  toggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ isEnabled: isEnabled }, () => {
      updateStatusText(isEnabled);
      // 通知当前标签页应用更改，不刷新页面
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          // 发送消息给 content script 而不是刷新页面
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'toggle', 
            isEnabled: isEnabled 
          }, () => {
            // 如果 content script 未加载，忽略错误
            if (chrome.runtime.lastError) {
              console.log('Content script not ready, page will apply on next load');
            }
          });
        }
      });
    });
  });
});

/**
 * 更新状态文本
 * @param {boolean} isEnabled
 */
function updateStatusText(isEnabled) {
  const statusText = document.getElementById('statusText');
  if (isEnabled) {
    statusText.textContent = '已启用';
    statusText.className = 'status-text enabled';
  } else {
    statusText.textContent = '已禁用';
    statusText.className = 'status-text disabled';
  }
}

/**
 * 加载单词表数量
 */
async function loadWordlistCount() {
  try {
    const response = await fetch(chrome.runtime.getURL('data/wordlist.json'));
    const wordlist = await response.json();
    const count = Object.keys(wordlist).length;
    document.getElementById('wordlistCount').textContent = `${count} 个词汇`;
  } catch (error) {
    console.error('加载单词表失败:', error);
    document.getElementById('wordlistCount').textContent = '加载失败';
  }
}
