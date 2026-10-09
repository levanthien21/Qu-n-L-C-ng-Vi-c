const fs = require('fs');
let c = fs.readFileSync('src/components/SOPGuide.tsx', 'utf8');
const regex = /<CheckItem id="([^"]+)"/g;
let match;
let ids = [];
while ((match = regex.exec(c)) !== null) {
  ids.push(match[1]);
}
console.log(ids);
