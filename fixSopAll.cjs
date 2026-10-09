const fs = require('fs');
let c = fs.readFileSync('src/components/SOPGuide.tsx', 'utf8');

const ALL_IDS = "['i_1_1', 'i_1_2', 'i_2_1', 'i_2_2', 'i_2_3', 'i_2_4', 'i_3_1', 'i_3_2', 'i_3_3', 'i_4_1', 'i_4_2', 'ii_1_1', 'ii_1_2', 'ii_1_3', 'ii_1_4', 'ii_1_5', 'ii_1_6', 'ii_1_7', 'ii_2_1', 'ii_2_2', 'ii_3_1', 'ii_3_2', 'ii_3_3', 'ii_3_4', 'ii_4_1', 'ii_4_2', 'ii_5_1', 'ii_5_2', 'ii_5_3', 'ii_5_4', 'ii_6_1', 'ii_6_2', 'ii_6_3', 'ii_6_4', 'iii_1', 'iii_2', 'iii_3', 'iii_4', 'iv_1_1', 'iv_1_2', 'iv_1_3', 'iv_2_1', 'iv_2_2', 'iv_2_3', 'iv_2_4', 'iv_2_5', 'v_1', 'v_2']";

const replacement = `<div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
             <div className="flex items-center gap-3">
               <span>Tiến độ hoàn thành SOP (Checklist)</span>
               <button 
                 onClick={() => {
                   if (window.confirm('Đánh dấu hoàn thành toàn bộ 48 bước SOP?')) {
                     const ids = ${ALL_IDS};
                     const newChecklist = { ...checklist };
                     ids.forEach(id => newChecklist[id] = true);
                     updateCustomer(customer.id, { sopChecklist: newChecklist });
                   }
                 }}
                 className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
               >
                 <Check size={12} /> Hoàn thành tất cả
               </button>
             </div>
             <span className={percent === 100 ? "text-emerald-600" : "text-indigo-600"}>{completedItems}/{totalItems} ({percent}%)</span>
           </div>`;

c = c.replace(
  /<div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">\s*<span>Tiến độ hoàn thành SOP \(Checklist\)<\/span>\s*<span className=\{percent === 100 \? "text-emerald-600" : "text-indigo-600"\}>\{completedItems\}\/\{totalItems\} \(\{percent\}%\)<\/span>\s*<\/div>/g,
  replacement
);

fs.writeFileSync('src/components/SOPGuide.tsx', c, 'utf8');
