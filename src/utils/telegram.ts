export const sendTelegramMessage = async (token: string, chatId: string, message: string) => {
  if (!token || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: message, 
        parse_mode: 'HTML' 
      })
    });
  } catch (e) {
    console.error('Lỗi gửi Telegram:', e);
  }
};
