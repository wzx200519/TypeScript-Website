const { readFileSync, readdirSync, statSync } = require('fs');
const { join, relative } = require('path');
const HANDBOOK_ROOT = join(process.cwd(), 'packages/documentation/copy/en/handbook-v2');
function collect(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) collect(f, acc);
    else if (e.endsWith('.md')) acc.push(f);
  }
  return acc;
}
const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/gm;
const results = [];
for (const f of collect(HANDBOOK_ROOT)) {
  const content = readFileSync(f, 'utf8');
  let m;
  while ((m = HEADING_REGEX.exec(content)) !== null) {
    results.push({ title: m[2].trim(), level: 'h' + m[1].length, file: relative(process.cwd(), f) });
  }
}
const target = results.find(r => r.title === 'Truthiness narrowing');
console.log('Truthiness narrowing:', target);
console.log('Total headings:', results.length);
