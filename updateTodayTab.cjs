const fs = require('fs');
let c = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

if (!c.includes('import { SOPGuide }')) {
   c = c.replace(
     "import { CustomerFormModal } from '../components/CustomerFormModal';",
     "import { CustomerFormModal } from '../components/CustomerFormModal';\nimport { SOPGuide } from '../components/SOPGuide';"
   );
}

const originalModalBody = `
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
          {stats.milestones.length > 0 && (
            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
`;

const replaceModalBody = `
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button onClick={() => setActiveTab('progress')} className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-colors \${activeTab === 'progress' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}>Tiến độ triển khai</button>
          <button onClick={() => setActiveTab('sop')} className={\`px-4 py-3 text-sm font-semibold border-b-2 transition-colors \${activeTab === 'sop' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}>Quy trình Support (SOP)</button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
          {activeTab === 'sop' ? (
             <SOPGuide />
          ) : (
            <>
          {stats.milestones.length > 0 && (
            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
`;

c = c.replace(originalModalBody, replaceModalBody);

// Close the React Fragment at the bottom of the modal content
const originalModalFooter = `
            {phases.length === 0 && (
               <div className="text-center p-8 text-slate-500">
                  Không tìm thấy công việc nào trong sheet "Lộ trình triển khai".
               </div>
            )}
          </div>
        </div>
`;
const replaceModalFooter = `
            {phases.length === 0 && (
               <div className="text-center p-8 text-slate-500">
                  Không tìm thấy công việc nào trong sheet "Lộ trình triển khai".
               </div>
            )}
          </div>
          </>
          )}
        </div>
`;

c = c.replace(originalModalFooter, replaceModalFooter);

// Update Modal Component State
const originalModalFunc = `function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const stats = parseSheetData(customer.sheetData);`;
  
const replaceModalFunc = `function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'progress' | 'sop'>('progress');
  const stats = parseSheetData(customer.sheetData);`;

c = c.replace(originalModalFunc, replaceModalFunc);

fs.writeFileSync('src/pages/TodayPage.tsx', c, 'utf8');
