const fs = require('fs');
let c = fs.readFileSync('src/data/supabaseRepository.ts', 'utf8');
c = c.replace(/\|\| 'global'/g, "|| 'thienbbh'");
fs.writeFileSync('src/data/supabaseRepository.ts', c, 'utf8');
