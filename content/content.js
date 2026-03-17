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

  try {
    // 初始化替换引擎
    await replacementEngine.init();
    console.log('替换引擎初始化完成，isEnabled:', replacementEngine.isEnabled);

    // 如果已启用，处理页面
    if (replacementEngine.isEnabled) {
      console.log('开始处理页面...');
      replacementEngine.processPage();
    } else {
      console.log('扩展未启用，跳过页面处理');
    }
  } catch (error) {
    console.error('Content Script 初始化失败:', error);
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
    } else if (request.action === 'reloadWordlist') {
      console.log('收到重新加载词表消息');
      // 重新加载词表并处理页面
      replacementEngine.loadWordlist().then(() => {
        if (replacementEngine.isEnabled) {
          // 清除之前的替换，重新处理
          restoreOriginalText();
          replacementEngine.processPage();
        }
      });
    }
    sendResponse({ status: 'ok' });
  });

  // 监听动态内容变化（MutationObserver）
  observeDynamicContent();

  // 监听 SPA 路由变化（history API）
  observeSPANavigation();

  // 监听页面可见性变化（处理后台标签页切换回来）
  observePageVisibility();
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
 * 监听 SPA 路由变化（history API 劫持）
 */
function observeSPANavigation() {
  // 劫持 pushState 和 replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleNavigation();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleNavigation();
  };

  // 监听 popstate 事件（后退/前进按钮）
  window.addEventListener('popstate', handleNavigation);

  // 监听 hashchange（锚点变化）
  window.addEventListener('hashchange', handleNavigation);
}

/**
 * 处理导航变化
 */
async function handleNavigation() {
  console.log('检测到页面导航，开始处理...');

  try {
    // 延迟执行，等待SPA页面内容加载
    await delay(500);

    // 重新加载设置（确保获取最新状态）
    await replacementEngine.loadSettings();
    console.log('导航后加载设置完成，isEnabled:', replacementEngine.isEnabled);

    // 如果已启用，处理新页面内容
    if (replacementEngine.isEnabled) {
      console.log('导航后自动处理页面');
      // 清除之前的处理标记，让新页面可以被处理
      clearProcessedMarks();
      replacementEngine.processPage();
    } else {
      console.log('扩展未启用，跳过导航后处理');
    }
  } catch (error) {
    console.error('导航处理失败:', error);
  }
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清除处理标记（让新页面内容可以被处理）
 */
function clearProcessedMarks() {
  // 清除之前页面的处理标记
  document.querySelectorAll('[data-inglish-processed]').forEach(el => {
    el.removeAttribute('data-inglish-processed');
  });
}

/**
 * 监听页面可见性变化
 */
function observePageVisibility() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      console.log('页面变为可见，检查状态');

      // 重新加载设置
      await replacementEngine.loadSettings();

      // 如果已启用但页面未处理，则处理
      if (replacementEngine.isEnabled) {
        const hasReplaced = document.querySelector('.inglish-replaced');
        if (!hasReplaced) {
          console.log('页面未处理，自动执行替换');
          replacementEngine.processPage();
        }
      }
    }
  });
}

/**
 * 监听动态内容变化（增量处理，只处理新增节点）
 */
function observeDynamicContent() {
  const observer = new MutationObserver((mutations) => {
    if (!replacementEngine.isEnabled) return;

    const newNodes = [];
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // 排除已替换的元素、tooltip和处理过的节点
        if (node.nodeType === Node.ELEMENT_NODE && 
            !node.classList?.contains('inglish-replaced') &&
            !node.classList?.contains('inglish-tooltip') &&
            !node.dataset?.inglishProcessed) {
          newNodes.push(node);
        } else if (node.nodeType === Node.TEXT_NODE && 
                   node.textContent.trim() &&
                   node.parentElement &&
                   !node.parentElement.closest('.inglish-replaced')) {
          // 处理直接添加的文本节点
          newNodes.push(node.parentElement);
        }
      });
    });

    // 去重：避免处理嵌套关系中的重复节点
    const uniqueNodes = [];
    const nodeSet = new Set();
    
    newNodes.forEach(node => {
      // 检查是否已有父节点在处理列表中
      let parent = node.parentElement;
      let isChildOfExisting = false;
      while (parent) {
        if (nodeSet.has(parent)) {
          isChildOfExisting = true;
          break;
        }
        parent = parent.parentElement;
      }
      
      if (!isChildOfExisting) {
        // 移除该节点的所有子节点（避免重复处理）
        nodeSet.forEach(existingNode => {
          if (existingNode.contains(node)) {
            nodeSet.delete(existingNode);
          }
        });
        
        nodeSet.add(node);
        uniqueNodes.push(node);
      }
    });

    if (uniqueNodes.length > 0) {
      // 延迟处理，避免频繁触发
      clearTimeout(window.inglishDebounceTimer);
      window.inglishDebounceTimer = setTimeout(() => {
        console.log(`处理 ${uniqueNodes.length} 个新增节点，isEnabled:`, replacementEngine.isEnabled);
        if (!replacementEngine.isEnabled) {
          console.log('扩展未启用，跳过新增节点处理');
          return;
        }
        // 只处理新增的节点，而不是整个页面
        uniqueNodes.forEach(node => {
          node.dataset.inglishProcessed = 'true';
          replacementEngine.processNode(node);
        });
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
