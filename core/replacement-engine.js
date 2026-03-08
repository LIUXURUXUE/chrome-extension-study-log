/**
 * 文本替换引擎
 * 高性能的文本替换核心，支持词汇替换、样式标记、悬停显示等功能
 */

class ReplacementEngine {
  constructor() {
    this.wordlist = {};
    this.isEnabled = false;
    this.nlp = nlpProcessor;
  }

  /**
   * 初始化引擎
   */
  async init() {
    this.nlp.init();
    await this.loadWordlist();
    await this.loadSettings();
    console.log('替换引擎初始化完成');
  }

  /**
   * 加载单词表
   */
  async loadWordlist() {
    try {
      // 从chrome.storage加载
      const result = await chrome.storage.local.get('wordlist');
      if (result.wordlist) {
        this.wordlist = result.wordlist;
      } else {
        // 从内置文件加载
        const response = await fetch(chrome.runtime.getURL('data/wordlist.json'));
        this.wordlist = await response.json();
        // 缓存到storage
        chrome.storage.local.set({ wordlist: this.wordlist });
      }
      console.log(`加载单词表成功，共 ${Object.keys(this.wordlist).length} 个词汇`);
    } catch (error) {
      console.error('加载单词表失败:', error);
      this.wordlist = {};
    }
  }

  /**
   * 加载用户设置
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('isEnabled');
      this.isEnabled = result.isEnabled || false;
    } catch (error) {
      console.error('加载设置失败:', error);
      this.isEnabled = false;
    }
  }

  /**
   * 启用/禁用替换引擎
   */
  async setEnabled(enabled) {
    this.isEnabled = enabled;
    await chrome.storage.local.set({ isEnabled: enabled });
  }

  /**
   * 执行文本替换（核心算法）
   * @param {string} text - 原始文本
   * @param {string} context - 上下文文本
   * @returns {string} 替换后的HTML
   */
  replace(text, context) {
    if (!this.isEnabled) {
      return text;
    }

    // 分词
    const segments = this.nlp.segment(text);
    if (segments.length === 0) {
      return text;
    }

    let result = '';
    let lastEnd = 0;

    // 遍历分词结果
    for (const segment of segments) {
      // 添加未匹配的原文部分
      result += text.slice(lastEnd, segment.start);

      // 查找替换词
      const chineseWord = segment.word;
      const englishOptions = this.findMatchingWords(chineseWord);

      if (englishOptions) {
        // 上下文分析选择最佳翻译
        const selectedEnglish = this.nlp.analyzeContext(chineseWord, englishOptions, context);
        // 生成带样式的HTML
        result += this.createReplacementTag(chineseWord, selectedEnglish);
      } else {
        // 没有匹配到，保留原文
        result += chineseWord;
      }

      lastEnd = segment.end;
    }

    // 添加剩余部分
    result += text.slice(lastEnd);

    return result;
  }

  /**
   * 查找匹配的英文翻译
   * @param {string} chineseWord - 中文词汇
   * @returns {string[]|null} 英文翻译数组或null
   */
  findMatchingWords(chineseWord) {
    // 精确匹配
    if (this.wordlist[chineseWord]) {
      return this.wordlist[chineseWord];
    }

    // 同义词匹配
    for (const [key, englishOptions] of Object.entries(this.wordlist)) {
      if (this.nlp.isSynonym(chineseWord, key)) {
        return englishOptions;
      }
    }

    return null;
  }

  /**
   * 创建替换标签
   * @param {string} original - 原始中文
   * @param {string} replacement - 英文替换
   * @returns {string} HTML标签
   */
  createReplacementTag(original, replacement) {
    // 使用data属性存储原始文本
    return `<span class="inglish-replaced" data-original="${original}">${replacement}</span>`;
  }

  /**
   * 批量处理DOM节点
   * @param {Node} node - DOM节点
   */
  processNode(node) {
    // 只处理文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const context = node.parentElement ? node.parentElement.textContent : '';

      // 执行替换
      const replaced = this.replace(text, context);

      // 如果有变化，替换节点内容
      if (replaced !== text) {
        const span = document.createElement('span');
        span.innerHTML = replaced;
        node.parentNode.replaceChild(span, node);
      }
    } else {
      // 递归处理子节点（跳过script、style、noscript等）
      if (this.shouldSkipNode(node)) {
        return;
      }

      // 从后往前遍历，避免节点替换导致索引问题
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        this.processNode(node.childNodes[i]);
      }
    }
  }

  /**
   * 判断是否跳过该节点
   * @param {Node} node
   * @returns {boolean}
   */
  shouldSkipNode(node) {
    const tagName = node.tagName && node.tagName.toLowerCase();
    const skipTags = ['script', 'style', 'noscript', 'iframe', 'svg', 'code', 'pre'];
    return skipTags.includes(tagName);
  }

  /**
   * 处理整个页面
   */
  processPage() {
    if (!this.isEnabled) {
      return;
    }

    console.log('开始处理页面...');
    this.processNode(document.body);
    console.log('页面处理完成');
  }

  /**
   * 预留接口：与其他项目通信
   * @param {object} data - 通信数据
   */
  async externalCommunicate(data) {
    console.log('预留外部通信接口:', data);
    // 未来实现与其他工具的联动
    return { status: 'success', message: '接口预留中' };
  }
}

// 导出单例
const replacementEngine = new ReplacementEngine();
