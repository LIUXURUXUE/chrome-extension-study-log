/**
 * Content Script
 * 负责注入到网页中执行替换逻辑
 */

// 等待页面完全加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}

async function initContentScript() {
  console.log('InGlish Content Script 启动');

  // 初始化替换引擎
  await replacementEngine.init();

  // 处理页面
  replacementEngine.processPage();

  // 监听设置变更
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isEnabled) {
      console.log('设置变更:', changes.isEnabled.newValue);
      if (changes.isEnabled.newValue) {
        replacementEngine.processPage();
      } else {
        // 重新加载页面恢复原文
        location.reload();
      }
    }
  });
}

// 添加悬停显示原文的事件委托
document.addEventListener('mouseover', (event) => {
  const target = event.target;
  if (target.classList.contains('inglish-replaced')) {
    showTooltip(target);
  }
});

document.addEventListener('mouseout', (event) => {
  const target = event.target;
  if (target.classList.contains('inglish-replaced')) {
    hideTooltip();
  }
});

/**
 * 显示原文提示框
 * @param {HTMLElement} target - 目标元素
 */
function showTooltip(target) {
  // 移除已存在的tooltip
  hideTooltip();

  const original = target.dataset.original;
  if (!original) return;

  // 创建tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'inglish-tooltip';
  tooltip.textContent = original;
  tooltip.id = 'inglish-tooltip-current';

  document.body.appendChild(tooltip);

  // 定位
  const rect = target.getBoundingClientRect();
  tooltip.style.left = rect.left + 'px';
  tooltip.style.top = (rect.bottom + 5) + 'px';
}

/**
 * 隐藏提示框
 */
function hideTooltip() {
  const existing = document.getElementById('inglish-tooltip-current');
  if (existing) {
    existing.remove();
  }
}
