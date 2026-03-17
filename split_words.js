const fs = require('fs');

// 读取生成的 JSON 文件
const content = fs.readFileSync('cet6_wordlist.json', 'utf-8');
const wordlist = JSON.parse(content);

const result = {};

// 清理函数：处理"把...除外"这类词语
function cleanChineseWord(word) {
  // 去掉"把..."前缀，保留后面的内容
  // 如："把…除外" -> "除外"
  return word.replace(/^把[…\.]+/, '').trim();
}

// 遍历所有词条
Object.entries(wordlist).forEach(([chinese, english]) => {
  // 检查是否包含空格
  if (chinese.includes(' ')) {
    // 按空格分割
    const parts = chinese.split(' ').map(p => p.trim()).filter(p => p);
    
    // 每个部分都作为独立的词条
    parts.forEach(part => {
      // 清理"把..."前缀
      const cleanPart = cleanChineseWord(part);
      if (cleanPart && /[\u4e00-\u9fa5]/.test(cleanPart)) {
        if (!result[cleanPart]) {
          result[cleanPart] = [];
        }
        // 合并英文（去重）
        english.forEach(en => {
          if (!result[cleanPart].includes(en)) {
            result[cleanPart].push(en);
          }
        });
      }
    });
  } else {
    // 不包含空格，清理后保留
    const cleanChinese = cleanChineseWord(chinese);
    if (!result[cleanChinese]) {
      result[cleanChinese] = [];
    }
    english.forEach(en => {
      if (!result[cleanChinese].includes(en)) {
        result[cleanChinese].push(en);
      }
    });
  }
});

// 按中文词排序
const sortedResult = {};
Object.keys(result).sort().forEach(key => {
  sortedResult[key] = result[key];
});

// 写入新的 JSON 文件
fs.writeFileSync('cet6_wordlist_split.json', JSON.stringify(sortedResult, null, 2), 'utf-8');

console.log(`处理完成！`);
console.log(`原词条数: ${Object.keys(wordlist).length}`);
console.log(`处理后词条数: ${Object.keys(sortedResult).length}`);
console.log('\n示例（分割后的词条）:');
Object.entries(sortedResult).filter(([k, v]) => v.length > 1).slice(0, 10).forEach(([cn, en]) => {
  console.log(`  "${cn}": ${JSON.stringify(en)}`);
});
