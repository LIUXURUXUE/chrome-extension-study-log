/**
 * Popup 脚本
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const wordlistCount = document.getElementById('wordlistCount');
  const wordlistSelect = document.getElementById('wordlistSelect');

  // 加载当前状态
  chrome.storage.local.get(['isEnabled', 'wordlist', 'wordlistType'], (result) => {
    // 更新开关状态
    toggle.checked = result.isEnabled || false;
    updateStatusText(result.isEnabled || false);

    // 更新词表选择
    const currentType = result.wordlistType || 'default';
    wordlistSelect.value = currentType;

    // 更新单词表数量
    updateWordlistCount(currentType);
  });

  // 监听词表选择变化
  wordlistSelect.addEventListener('change', async (e) => {
    const selectedType = e.target.value;
    console.log('切换词表:', selectedType);

    // 保存选择
    await chrome.storage.local.set({ wordlistType: selectedType });

    // 加载对应的词表
    await loadWordlist(selectedType);

    // 更新显示数量
    updateWordlistCount(selectedType);

    // 如果扩展已启用，通知 content script 重新加载词表
    if (toggle.checked) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'reloadWordlist'
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('Content script not ready');
            }
          });
        }
      });
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
 * 更新单词表数量显示
 * @param {string} type - 词表类型
 */
async function updateWordlistCount(type) {
  try {
    let count = 0;
    if (type === 'cet6') {
      const response = await fetch(chrome.runtime.getURL('cet6_wordlist_split.json'));
      const wordlist = await response.json();
      count = Object.keys(wordlist).length;
    } else {
      const response = await fetch(chrome.runtime.getURL('data/wordlist.json'));
      const wordlist = await response.json();
      count = Object.keys(wordlist).length;
    }
    document.getElementById('wordlistCount').textContent = `${count} 个词汇`;
  } catch (error) {
    console.error('加载单词表失败:', error);
    document.getElementById('wordlistCount').textContent = '加载失败';
  }
}

/**
 * 加载指定词表到 storage
 * @param {string} type - 词表类型
 */
async function loadWordlist(type) {
  try {
    let wordlist;
    if (type === 'cet6') {
      const response = await fetch(chrome.runtime.getURL('cet6_wordlist_split.json'));
      wordlist = await response.json();
    } else {
      const response = await fetch(chrome.runtime.getURL('data/wordlist.json'));
      wordlist = await response.json();
    }
    await chrome.storage.local.set({ wordlist: wordlist });
    console.log(`词表 ${type} 加载完成，共 ${Object.keys(wordlist).length} 个词汇`);
  } catch (error) {
    console.error('加载词表失败:', error);
  }
}
