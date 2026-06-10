const { decodeVIN } = require('../../api/vin.service');

const userState = {};

function setUserState(chatId, state) {
  userState[chatId] = state;
}

function getUserState(chatId) {
  return userState[chatId] || {};
}

function clearUserState(chatId) {
  delete userState[chatId];
}

async function handleVINInput(bot, chatId, text) {
  const vin = text.trim().toUpperCase();

  if (vin.length !== 17 || /[IOQ]/.test(vin)) {
    return bot.sendMessage(chatId, '❌ VIN inválido. Debe tener exactamente 17 caracteres sin las letras I, O o Q. Intenta nuevamente:');
  }

  await bot.sendMessage(chatId, '🔍 Verificando VIN, por favor espera...');

  const vehicle = await decodeVIN(vin);

  if (!vehicle) {
    return bot.sendMessage(chatId, '❌ No se encontró información para ese VIN. Verifica el número e intenta nuevamente:');
  }

  return vehicle;
}

module.exports = { handleVINInput, setUserState, getUserState, clearUserState };
