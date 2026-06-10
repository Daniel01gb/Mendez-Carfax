const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_BOT_TOKEN } = require('../config/env');
const { handleVINInput, setUserState, getUserState, clearUserState } = require('./handlers/vin');
const { handlePayment } = require('./handlers/payment');

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  clearUserState(chatId);

  bot.sendMessage(chatId,
    `🚗 *Bienvenido a Mendez Carfax*\n\n` +
    `Obtén el historial completo de cualquier vehículo en segundos.\n\n` +
    `Toca el botón para comenzar:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 HAGA CLIC AQUÍ', callback_data: 'menu' }
        ]]
      }
    }
  );
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  bot.answerCallbackQuery(query.id);

  if (data === 'menu') {
    bot.sendMessage(chatId, '¿Qué reporte deseas obtener?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Solicitar CARFAX 🚗 — $24.99', callback_data: 'type_carfax' }],
          [{ text: 'Solicitar CARFAX + RESUMEN DETALLADO 📊 — $39.99', callback_data: 'type_carfax_detailed' }],
        ]
      }
    });
  }

  if (data === 'type_carfax' || data === 'type_carfax_detailed') {
    const type = data === 'type_carfax' ? 'carfax' : 'carfax_detailed';
    setUserState(chatId, { step: 'awaiting_vin', type });
    bot.sendMessage(chatId, '🔢 Ingresa el VIN del vehículo (17 caracteres, sin espacios):');
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  const state = getUserState(chatId);
  if (state.step !== 'awaiting_vin') return;

  try {
    const vehicle = await handleVINInput(bot, chatId, text);
    if (!vehicle) return;

    clearUserState(chatId);
    await handlePayment(bot, chatId, vehicle.vin, state.type, vehicle);
  } catch (err) {
    console.error('Error procesando VIN:', err.message);
    bot.sendMessage(chatId, '⚠️ Ocurrió un error. Por favor intenta de nuevo más tarde.');
  }
});

module.exports = bot;
