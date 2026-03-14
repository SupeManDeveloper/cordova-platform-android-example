const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/const LV = \[([\s\S]*?)\];/);
if (!match) { console.log('LV not found'); process.exit(1); }
eval('var LV = [' + match[1] + '];');

let issues = [];
LV.forEach((L, i) => {
  const Lts = L.ts || L.n;
  const tot = L.g[0] * L.g[1];
  const expected = L.gr * Lts;
  if(tot !== expected) {
    issues.push(`Level ${i+1}: grid ${tot}, expected tiles ${expected} (ex=${tot-expected})`);
  }
});
if(issues.length > 0) {
  console.log(issues.join('\n'));
} else {
  console.log('All levels OK');
}
