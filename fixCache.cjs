const fs = require('fs');
let c = fs.readFileSync('api/cron.ts', 'utf8');

c = c.replace(
  'export default async function handler(req: any, res: any) {\n  try {',
  "export default async function handler(req: any, res: any) {\n  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');\n  res.setHeader('Pragma', 'no-cache');\n  res.setHeader('Expires', '0');\n  res.setHeader('Surrogate-Control', 'no-store');\n  try {"
);

fs.writeFileSync('api/cron.ts', c, 'utf8');
