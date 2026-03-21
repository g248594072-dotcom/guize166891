import fs from 'fs';
const p = new URL('./src/规则/utils/chronicleUpdater.ts', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const block = `  // 移除 thinking 标签
  let cleaned = messageContent.replace(/<thinking>[\\s\\S]*?<\\/thinking>/gi, '');
  cleaned = cleaned.replace(/<think>[\\s\\S]*?<\\/redacted_reasoning>/gi, '');

`;
if (!t.includes('let cleaned = messageContent.replace')) process.exit(1);
t = t.replace(block, '');
fs.writeFileSync(p, t);
console.log('ok');
