const fs = require('fs');
let c = fs.readFileSync('src/components/SOPGuide.tsx', 'utf8');

if (!c.includes('sendTelegramMessage')) {
   c = c.replace(
     "import { ProgressBar } from './ui';",
     "import { ProgressBar } from './ui';\nimport { sendTelegramMessage } from '../utils/telegram';"
   );
}

const toggleLogic = `    const toggle = () => {
      const newChecklist = { ...checklist, [id]: !isChecked };
      updateCustomer(customer.id, { sopChecklist: newChecklist });
      
      const { settings } = useStore.getState();
      if (!isChecked && settings.telegramToken && settings.telegramChatId && settings.telegramNotifyProgress) {
         let stepName = "";
         if(typeof children === 'string') stepName = children;
         else if(Array.isArray(children)) stepName = children.map(x => typeof x === 'string' ? x : '').join('');
         
         if(stepName.length > 50) stepName = stepName.substring(0,50) + '...';
         sendTelegramMessage(
            settings.telegramToken,
            settings.telegramChatId,
            \`✅ <b>CẬP NHẬT TIẾN ĐỘ SOP</b>\\n\\nKhách hàng: <b>\${customer.name}</b>\\nVừa hoàn thành bước:\\n<i>\${stepName || 'Một hạng mục trong lộ trình'}</i>\`
         );
      }
    };`;

c = c.replace(/    const toggle = \(\) => \{[\s\S]*?    \};/, toggleLogic);

fs.writeFileSync('src/components/SOPGuide.tsx', c, 'utf8');
