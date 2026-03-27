import 'dotenv/config';
// @ts-ignore
import TelegramBot from 'node-telegram-bot-api';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function setupTelegram() {
  console.log('🤖 JobOS Telegram Bot Setup\n');
  console.log('1. Open Telegram and search for @BotFather');
  console.log('2. Send /newbot and follow the instructions');
  console.log('3. Copy the HTTP API Token provided by BotFather\n');

  let token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token || token.trim() === '') {
    token = await askQuestion('Paste your Telegram Bot Token here: ');
  } else {
    console.log(`Using existing token from .env: ${token.substring(0, 5)}...`);
  }

  if (!token) {
    console.error('❌ Token is required');
    process.exit(1);
  }

  console.log('\nStarting bot to detect your Chat ID...');
  const bot = new TelegramBot(token, { polling: true });

  console.log('\n📱 ACTION REQUIRED:');
  console.log('1. Go to Telegram and start a chat with your new bot');
  console.log('2. Send the message /start to the bot');
  console.log('Waiting for you to send /start...\n');

  bot.onText(/\/start/, (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    console.log(`✅ Received /start from chat ID: ${chatId}`);
    
    updateEnvFile(token as string, chatId.toString());
    
    bot.sendMessage(chatId, '🤖 JobOS Bot Setup Complete!\nI will send you pending approvals and daily briefings here.');
    
    setTimeout(() => {
      console.log('\nSetup complete! You can safely close this script or press Ctrl+C.');
      process.exit(0);
    }, 1000);
  });
}

function updateEnvFile(token: string, chatId: string) {
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const updates = {
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_CHAT_ID: chatId,
    TELEGRAM_APPROVAL_TIMEOUT_HOURS: '2',
    TELEGRAM_BATCH_APPROVALS: 'true'
  };

  let newEnvContent = envContent;
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(newEnvContent)) {
      newEnvContent = newEnvContent.replace(regex, `${key}=${value}`);
    } else {
      newEnvContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, newEnvContent.trim() + '\n');
  console.log('✅ Updated .env file with Telegram credentials');
}

setupTelegram().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});
