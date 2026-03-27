// @ts-ignore
import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export let telegramBot: TelegramBot | null = null;

if (env.TELEGRAM_BOT_TOKEN) {
  try {
    telegramBot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
    logger.info('Telegram Bot initialized', { source: 'telegram' });

    // Prevent app from crashing on polling or connection errors
    telegramBot.on('polling_error', (err) => {
      logger.error('Telegram polling error', { error: err.message, source: 'telegram' });
    });
    
    telegramBot.on('error', (err) => {
      logger.error('Telegram general error', { error: err.message, source: 'telegram' });
    });
  } catch (err) {
    logger.error('Failed to initialize Telegram Bot', { error: err, source: 'telegram' });
  }
} else {
  logger.warn('TELEGRAM_BOT_TOKEN not provided, Telegram features disabled.', { source: 'telegram' });
}

export const sendTelegramMessage = async (text: string, options?: TelegramBot.SendMessageOptions) => {
  if (!telegramBot || !env.TELEGRAM_CHAT_ID) return null;
  
  try {
    return await telegramBot.sendMessage(env.TELEGRAM_CHAT_ID, text, options);
  } catch (error) {
    logger.error('Failed to send Telegram message:', { error, source: 'telegram' });
    return null;
  }
};

export const editTelegramMessage = async (messageId: number, text: string, options?: TelegramBot.EditMessageTextOptions) => {
  if (!telegramBot || !env.TELEGRAM_CHAT_ID) return null;
  
  try {
    return await telegramBot.editMessageText(text, {
      chat_id: env.TELEGRAM_CHAT_ID,
      message_id: messageId,
      ...options
    });
  } catch (error) {
    logger.error('Failed to edit Telegram message:', { error, source: 'telegram' });
    return null;
  }
};

export const sendTelegramPhoto = async (photo: string | Buffer, options?: TelegramBot.SendPhotoOptions, fileOptions?: any) => {
  if (!telegramBot || !env.TELEGRAM_CHAT_ID) return null;
  
  try {
    return await telegramBot.sendPhoto(env.TELEGRAM_CHAT_ID, photo, options, fileOptions);
  } catch (error) {
    logger.error('Failed to send Telegram photo:', { error, source: 'telegram' });
    return null;
  }
};
