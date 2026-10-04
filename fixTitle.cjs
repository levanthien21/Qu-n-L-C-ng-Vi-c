const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(/<title>.*?<\/title>/, '<title>DVHL Support Manager</title>');
fs.writeFileSync('index.html', c, 'utf8');
