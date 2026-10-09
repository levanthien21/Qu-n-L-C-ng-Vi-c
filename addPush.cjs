const fs = require('fs');
let c = fs.readFileSync('src/components/MeetingScheduler.tsx', 'utf8');

if (!c.includes("import { sendTelegramMessage }")) {
  c = c.replace(
    "import { useStore } from '../store/useStore';",
    "import { useStore } from '../store/useStore';\nimport { sendTelegramMessage } from '../utils/telegram';"
  );
}

// Modify the add function
c = c.replace(
  /const add = \(e: React\.FormEvent\) => \{[\s\S]*?setDate\(null\);\n  \};/,
  `const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const label = typeOf(type).label;
    const isoDate = toLocalInput(date);
    const m = { id: Date.now().toString(), date: isoDate, note: label, type };
    
    const store = useStore.getState();
    const customer = store.customers.find(c => c.id === customerId);
    const settings = store.settings;
    
    if (customer && settings && settings.telegramToken && settings.telegramChatId) {
       const timeStr = date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
       sendTelegramMessage(
          settings.telegramToken,
          settings.telegramChatId,
          \`🆕 <b>ĐÃ THÊM LỊCH HẸN MỚI</b>\\nKhách hàng: <b>\${customer.name}</b>\\nNội dung: \${label}\\nThời gian: \${timeStr}\`
       );
    }

    save([...meetings, m].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setDate(null);
  };`
);

fs.writeFileSync('src/components/MeetingScheduler.tsx', c, 'utf8');
