const fs = require('fs');

// 读取词表
const content = fs.readFileSync('cet6_wordlist_split.json', 'utf-8');
const wordlist = JSON.parse(content);

// 提取所有中文词条
const entries = Object.entries(wordlist);

// 按相似度分组排序
// 策略：按首字分组，然后按字数排序，让相同前缀的词语相邻
function getSimilarityKey(word) {
  // 取前两个字作为分组键（如果只有一个字就取一个字）
  if (word.length >= 2) {
    return word.substring(0, 2);
  }
  return word;
}

// 先按首字分组
const groups = {};
entries.forEach(([chinese, english]) => {
  const key = getSimilarityKey(chinese);
  if (!groups[key]) {
    groups[key] = [];
  }
  groups[key].push({ chinese, english });
});

// 对每个组内的词条排序（按字数从少到多，然后按字母顺序）
Object.keys(groups).forEach(key => {
  groups[key].sort((a, b) => {
    // 先按字数排序（短的在前）
    if (a.chinese.length !== b.chinese.length) {
      return a.chinese.length - b.chinese.length;
    }
    // 字数相同按字母顺序
    return a.chinese.localeCompare(b.chinese, 'zh-CN');
  });
});

// 按组的键排序，然后合并
const sortedGroups = Object.keys(groups).sort((a, b) => {
  return a.localeCompare(b, 'zh-CN');
});

const result = {};
sortedGroups.forEach(key => {
  groups[key].forEach(({ chinese, english }) => {
    result[chinese] = english;
  });
});

// 写入新的 JSON 文件
fs.writeFileSync('cet6_wordlist_grouped.json', JSON.stringify(result, null, 2), 'utf-8');

console.log('分组排序完成！');
console.log(`总词条数: ${Object.keys(result).length}`);
console.log(`分组数: ${sortedGroups.length}`);

// 显示一些示例
console.log('\n前20个词条示例：');
Object.entries(result).slice(0, 20).forEach(([cn, en]) => {
  console.log(`  "${cn}": ${JSON.stringify(en)}`);
});

// 显示一个分组示例
console.log('\n"一致"分组示例：');
const exampleGroup = groups['一致'];
if (exampleGroup) {
  exampleGroup.forEach(({ chinese, english }) => {
    console.log(`  "${chinese}": ${JSON.stringify(english)}`);
  });
}
