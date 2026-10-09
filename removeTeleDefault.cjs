const fs = require('fs');

// 1. Revert types.ts
let types = fs.readFileSync('src/domain/types.ts', 'utf8');
types = types.replace(
  /telegramToken: '8810340638:AAGooPsfR68rBQIVDhJjwtreNvQxq6gEt9I',\s*telegramChatId: '8770897961',/,
  `telegramToken: '',
  telegramChatId: '',`
);
fs.writeFileSync('src/domain/types.ts', types, 'utf8');

// 2. Revert useStore.ts
let store = fs.readFileSync('src/store/useStore.ts', 'utf8');
store = store.replace(
  /data\.settings\.telegramToken = data\.settings\.telegramToken \|\| DEFAULT_SETTINGS\.telegramToken;\s*data\.settings\.telegramChatId = data\.settings\.telegramChatId \|\| DEFAULT_SETTINGS\.telegramChatId;/g,
  ""
);
fs.writeFileSync('src/store/useStore.ts', store, 'utf8');
