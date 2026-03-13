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

  // 如果已启用，处理页面
  if (replacementEngine.isEnabled) {
    replacementEngine.processPage();
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle') {
      console.log('收到切换消息:', request.isEnabled);
      replacementEngine.setEnabled(request.isEnabled).then(() => {
        if (request.isEnabled) {
          replacementEngine.processPage();
        } else {
          // 禁用时不刷新页面，而是恢复原文
          restoreOriginalText();
        }
      });
    }
    sendResponse({ status: 'ok' });
  });

  // 监听动态内容变化（MutationObserver）
  observeDynamicContent();
}

/**
 * 恢复原文（不刷新页面）
 */
function restoreOriginalText() {
  const replacedElements = document.querySelectorAll('.inglish-replaced');
  replacedElements.forEach(el => {
    const original = el.dataset.original;
    if (original) {
      el.outerHTML = original;
    }
  });
}

/**
 * 监听动态内容变化
 */
function observeDynamicContent() {
  const observer = new MutationObserver((mutations) => {
    if (!replacementEngine.isEnabled) return;

    let hasNewContent = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && !node.classList?.contains('inglish-replaced')) {
          hasNewContent = true;
        }
      });
    });

    if (hasNewContent) {
      // 延迟处理，避免频繁触发
      clearTimeout(window.inglishDebounceTimer);
      window.inglishDebounceTimer = setTimeout(() => {
        replacementEngine.processPage();
      }, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
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
