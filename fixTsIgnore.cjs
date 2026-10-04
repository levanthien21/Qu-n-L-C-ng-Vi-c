const fs = require('fs');
let c = fs.readFileSync('src/data/supabaseRepository.ts', 'utf8');
c = c.replace(/const supabaseUrl/g, '// @ts-ignore\nconst supabaseUrl');
c = c.replace(/const supabaseKey/g, '// @ts-ignore\nconst supabaseKey');
fs.writeFileSync('src/data/supabaseRepository.ts', c, 'utf8');
