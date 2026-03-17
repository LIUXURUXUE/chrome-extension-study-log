# InGlish

一个帮助用户通过英语考试的 Chrome 扩展，通过将中文网页中的考纲词汇替换为英文，实现沉浸式学习。

## 功能特性

- 🔄 智能替换：自动识别并替换网页中的中文词汇为英文
- 📚 多词表支持：支持默认词表和 CET6 考纲词表（4000+ 词汇）
- 🎲 随机显示：多义词随机显示其中一个英文释义
- 💡 悬停提示：鼠标悬停显示原文
- ⚡ 高性能：异步分批处理，避免页面卡顿
- 🎯 精准匹配：基于浏览器内置 Intl.Segmenter 分词

## 安装方法

1. 下载本项目代码
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目文件夹

## 使用方法

1. 点击浏览器右上角的 InGlish 图标打开弹窗
2. 选择词表（默认词表或 CET6 考纲）
3. 开启开关启用替换
4. 浏览网页时，中文词汇会自动替换为英文
5. 鼠标悬停可查看原文

## 项目结构

```
chrome-extension-study-log/
├── manifest.json          # 扩展配置文件
├── content/               # 内容脚本
│   ├── content.js        # 页面替换逻辑
│   └── content.css       # 替换样式
├── core/                  # 核心模块
│   ├── nlp-processor.js  # NLP 分词处理器
│   └── replacement-engine.js  # 替换引擎
├── popup/                 # 弹窗界面
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── data/                  # 数据文件
│   └── wordlist.json     # 默认词表
├── cet6_wordlist.json    # CET6 原始词表
├── cet6_wordlist_split.json  # CET6 分割后词表
├── cet6_wordlist_grouped.json # CET6 分组排序词表
├── parse_cet6.js         # CET6 解析脚本
├── split_words.js        # 词条分割脚本
├── group_similar_words.js # 分组排序脚本
└── learning-notes/       # 学习笔记
```

## 待办事项 (TODO)

### 1. 自然语言处理 (NLP)
- [ ] 上下文语义分析，选择最合适的英文释义
- [ ] 词性标注和句法分析
- [ ] 同义词消歧
- [ ] 支持更多分词算法

### 2. 词表纠错
- [ ] 用户反馈错误词条入口
- [ ] 自动检测疑似错误翻译
- [ ] 词表版本管理和更新机制
- [ ] 社区贡献和审核流程

### 3. 多页页面点击下一页不刷新
- [ ] 优化 SPA (单页应用) 路由检测
- [ ] 支持 AJAX 动态加载内容的自动处理
- [ ] 改进 MutationObserver 检测逻辑
- [ ] 解决百度等搜索结果页翻页问题

### 4. 词表导入
- [ ] 支持用户自定义词表导入
- [ ] 支持 Excel/CSV 格式
- [ ] 在线词表市场
- [ ] 词表分享和下载功能

## 技术栈

- Chrome Extension Manifest V3
- JavaScript (ES6+)
- Intl.Segmenter API (浏览器内置分词)
- Chrome Storage API

## 许可证

MIT License
