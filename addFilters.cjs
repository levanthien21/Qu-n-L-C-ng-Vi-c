const fs = require('fs');

// 1. Remove date from Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(/<div className="mb-6 flex flex-wrap items-center justify-between gap-4">\s*<div>\s*<div className="text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">\{weekdayVN\(today\)\}<\/div>\s*<h1 className="text-2xl font-extrabold">\{formatVN\(today\)\}<\/h1>\s*<\/div>\s*<\/div>/g, '');
fs.writeFileSync('src/components/Layout.tsx', layout, 'utf8');

// 2. Add filters to TodayPage.tsx
let today = fs.readFileSync('src/pages/TodayPage.tsx', 'utf8');

if (!today.includes('const [searchTerm, setSearchTerm]')) {
  // Add state
  today = today.replace(
    'const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);',
    'const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);\n  const [searchTerm, setSearchTerm] = useState("");\n  const [filterStatus, setFilterStatus] = useState("ALL");'
  );

  // Add lucide-react import
  today = today.replace('import { ExternalLink, RefreshCw', 'import { Search, Filter, ExternalLink, RefreshCw');

  // Filter the lists
  today = today.replace(
    'const total = customers.length;',
    `const filteredCustomers = customers.filter(c => {
    const stats = parseSheetData(c.sheetData);
    const status = getCustomerStatus(stats);
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || status === filterStatus;
    return matchSearch && matchStatus;
  });
  
  const total = filteredCustomers.length;`
  );

  today = today.replace('const activeCustomers = customers.filter', 'const activeCustomers = filteredCustomers.filter');
  today = today.replace('const completedList = customers.filter', 'const completedList = filteredCustomers.filter');
  today = today.replace('const completedCount = customers.filter', 'const completedCount = filteredCustomers.filter');

  // Add UI for filters above the first table
  const filtersUI = `
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm khách hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 bg-white shadow-sm"
          />
        </div>
        <div className="relative sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter size={16} className="text-slate-400" />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input pl-10 bg-white shadow-sm appearance-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DV-Gets">DV-Gets</option>
            <option value="DV – CB Kiến Thức">DV – CB Kiến Thức</option>
            <option value="DV – Test AI">DV – Test AI</option>
            <option value="DV – Actual Run">DV – Actual Run</option>
            <option value="DV – Done">DV – Done</option>
          </select>
        </div>
      </div>
  `;
  
  today = today.replace(
    '<div className="mb-8">',
    `${filtersUI}\n      <div className="mb-8">`
  );

  fs.writeFileSync('src/pages/TodayPage.tsx', today, 'utf8');
}
