/**
 * NLP分词处理器
 * 使用浏览器内置 Intl.Segmenter 进行分词
 */

class NLPProcessor {
  constructor() {
    this.segmenter = null;
    this.useNativeSegmenter = false;
  }

  /**
   * 初始化分词器
   * 优先使用浏览器内置的 Intl.Segmenter，不支持则回退到正则
   */
  init() {
    // 检测浏览器是否支持 Intl.Segmenter
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        this.segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
        this.useNativeSegmenter = true;
        console.log('NLP处理器初始化完成（使用浏览器内置 Intl.Segmenter 分词）');
      } catch (error) {
        console.warn('Intl.Segmenter 初始化失败，回退到正则分词:', error);
        this.useNativeSegmenter = false;
      }
    } else {
      console.log('NLP处理器初始化完成（浏览器不支持 Intl.Segmenter，使用正则分词）');
      this.useNativeSegmenter = false;
    }
  }

  /**
   * 分词并返回词汇列表
   * @param {string} text - 待分词文本
   * @returns {Array} 分词结果 [{word: '词汇', start: 0, end: 2}, ...]
   */
  segment(text) {
    if (this.useNativeSegmenter && this.segmenter) {
      return this.segmentWithIntl(text);
    }
    return this.segmentWithRegex(text);
  }

  /**
   * 使用浏览器内置 Intl.Segmenter 分词
   * 支持中文、日文、韩文等语言的语义分词
   * @param {string} text - 待分词文本
   * @returns {Array} 分词结果
   */
  segmentWithIntl(text) {
    const results = [];
    let currentIndex = 0;

    // 使用 Intl.Segmenter 进行分词
    const segments = this.segmenter.segment(text);

    for (const segment of segments) {
      const word = segment.segment;
      const isWordLike = segment.isWordLike;

      // 只保留中文字词（isWordLike 为 true 且包含中文字符）
      if (isWordLike && /[\u4e00-\u9fa5]/.test(word)) {
        results.push({
          word: word,
          start: currentIndex,
          end: currentIndex + word.length
        });
      }

      currentIndex += word.length;
    }

    return results;
  }

  /**
   * 使用正则分词（回退方案）
   * 当浏览器不支持 Intl.Segmenter 时使用
   * @param {string} text - 待分词文本
   * @returns {Array} 分词结果
   */
  segmentWithRegex(text) {
    const results = [];
    // 使用正则匹配中文词汇
    // [\u4e00-\u9fa5]+ 匹配连续中文字符
    const regex = /[\u4e00-\u9fa5]+/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      results.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return results;
  }

  /**
   * 上下文分析：根据上下文选择最合适的英文翻译
   * @param {string} chineseWord - 中文词汇
   * @param {string[]} englishOptions - 英文翻译选项
   * @param {string} context - 上下文文本
   * @returns {string} 选中的英文翻译
   */
  analyzeContext(chineseWord, englishOptions, context) {
    // 暂时实现：选择序号最小的（第一个）
    // 未来可替换为真正的上下文分析算法
    if (!englishOptions || englishOptions.length === 0) {
      return englishWord;
    }
    return englishOptions[0];
  }

  /**
   * 判断两个词汇是否为同义词
   * @param {string} word1
   * @param {string} word2
   * @returns {boolean}
   */
  isSynonym(word1, word2) {
    // 暂时实现：简单判断是否在预设的同义词列表中
    // 未来可扩展为基于词向量的相似度计算
    const synonymMap = {
      '考试': ['测验', '考查'],
      '学习': ['学习', '研究', '钻研'],
      '重要': ['重要', '关键', '关键性']
    };

    // 检查是否在同一组同义词中
    for (const group of Object.values(synonymMap)) {
      if (group.includes(word1) && group.includes(word2)) {
        return true;
      }
    }

    return false;
  }
}

// 导出单例
const nlpProcessor = new NLPProcessor();
