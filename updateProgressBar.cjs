const fs = require('fs');
let c = fs.readFileSync('src/components/ui.tsx', 'utf8');

const regex = /export function ProgressBar\(\{[\s\S]+?\}\)\;\n\}/;

const replacement = `export function ProgressBar({ percent, tone = 'indigo' }: { percent: number; tone?: 'indigo' | 'green' | 'red' }) {
  let color = 'bg-gradient-to-r from-slate-300 to-slate-400';
  
  if (tone === 'green' || percent === 100) {
    color = 'bg-gradient-to-r from-emerald-400 to-emerald-600';
  } else if (tone === 'red') {
    color = 'bg-gradient-to-r from-red-400 to-red-600';
  } else {
    // Dynamic color from light to dark based on percent
    if (percent <= 25) {
      color = 'bg-gradient-to-r from-slate-300 to-slate-400';
    } else if (percent <= 50) {
      color = 'bg-gradient-to-r from-amber-300 to-amber-500';
    } else if (percent <= 75) {
      color = 'bg-gradient-to-r from-orange-400 to-orange-600';
    } else {
      color = 'bg-gradient-to-r from-indigo-400 to-indigo-600';
    }
  }

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner">
      <div className={\`relative h-full overflow-hidden rounded-full transition-all duration-1000 ease-out \${color}\`} style={{ width: \`\${Math.min(100, Math.max(0, percent))}%\` }}>
        <span className="shimmer-bar absolute inset-0 opacity-50" />
      </div>
    </div>
  );
}`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/components/ui.tsx', c, 'utf8');
