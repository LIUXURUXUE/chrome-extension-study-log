const fs = require('fs');

// 读取 CET6.txt 文件
const content = fs.readFileSync('CET6.txt', 'utf-8');
const lines = content.split('\n');

const result = {};

lines.forEach((line, index) => {
  // 跳过标题行
  if (index === 0) return;
  
  // 去除首尾空白
  line = line.trim();
  if (!line) return;
  
  // 匹配：英文单词 + 词性 + 中文释义
  // 格式：word      n.中文1，中文2
  const match = line.match(/^(\w+)\s+[a-z]+\.(.+)$/i);
  
  if (match) {
    const english = match[1];
    const chinesePart = match[2];
    
    // 先清理词性标记，再按标点分隔
    const cleanChinesePart = chinesePart
      .replace(/&/g, '') // 去除 & 符号
      .replace(/\b(vt|vi|v|n|a|ad|prep|conj|int|pron|aux)\b\.?/gi, '')
      .replace(/[()（）]/g, '');
    
    // 提取中文释义（按逗号、分号、顿号分隔）
    const meanings = cleanChinesePart
      .split(/[,，;；、]/)
      .map(m => m.trim())
      .filter(m => m && m.length > 0);
    
    // 每个中文词作为键，英文作为值
    meanings.forEach(meaning => {
      // 清理中文词
      const cleanMeaning = meaning.trim();
      
      if (cleanMeaning && cleanMeaning.length > 0 && /[\u4e00-\u9fa5]/.test(cleanMeaning)) {
        if (!result[cleanMeaning]) {
          result[cleanMeaning] = [];
        }
        if (!result[cleanMeaning].includes(english)) {
          result[cleanMeaning].push(english);
        }
      }
    });
  }
});

// 按中文词排序
const sortedResult = {};
Object.keys(result).sort().forEach(key => {
  sortedResult[key] = result[key];
});

// 写入 JSON 文件
fs.writeFileSync('cet6_wordlist.json', JSON.stringify(sortedResult, null, 2), 'utf-8');

console.log(`处理完成！共提取 ${Object.keys(sortedResult).length} 个中文词条`);
console.log('前10个示例：');
Object.entries(sortedResult).slice(0, 10).forEach(([cn, en]) => {
  console.log(`  "${cn}": ${JSON.stringify(en)}`);
});
