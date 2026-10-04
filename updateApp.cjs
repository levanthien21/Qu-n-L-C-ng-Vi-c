const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

if (!c.includes('sendTelegramMessage')) {
   c = c.replace(
     "import { useStore } from './store/useStore';",
     "import { useStore } from './store/useStore';\nimport { sendTelegramMessage } from './utils/telegram';"
   );
}

const intervalLogic = `
  // Telegram Background Task
  useEffect(() => {
    const interval = setInterval(() => {
      const { customers, settings, updateCustomer } = useStore.getState();
      if (!settings.telegramToken || !settings.telegramChatId || !settings.telegramNotifyMeetings) return;

      const now = new Date().getTime();
      let hasUpdate = false;
      
      const newCustomers = customers.map(c => {
         if (!c.meetingNotes || c.meetingNotes.length === 0) return c;
         
         let changed = false;
         const newNotes = c.meetingNotes.map(m => {
            const mTime = new Date(m.date).getTime();
            // Remind 30 mins before
            if (!m.notified && mTime > now && mTime - now <= 30 * 60000) {
               sendTelegramMessage(
                  settings.telegramToken, 
                  settings.telegramChatId, 
                  \`🔔 <b>NHẮC HẸN MEETING SẮP TỚI</b>\\n\\nKhách hàng: <b>\${c.name}</b>\\nLịch hẹn: \${new Date(m.date).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}\\nNội dung: \${m.note}\`
               );
               changed = true;
               return { ...m, notified: true };
            }
            return m;
         });

         if (changed) {
            updateCustomer(c.id, { meetingNotes: newNotes });
            hasUpdate = true;
         }
         return c;
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
`;

c = c.replace('  }, []);\n\n  return (', '  }, []);\n\n' + intervalLogic + '\n  return (');

fs.writeFileSync('src/App.tsx', c, 'utf8');
