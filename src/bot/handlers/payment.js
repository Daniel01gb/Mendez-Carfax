const { createPaymentLink } = require('../../api/square.service');
const { createOrder } = require('../../db/orders');

async function handlePayment(bot, chatId, vin, type, vehicleInfo) {
  const link = await createPaymentLink({ chatId, vin, type, vehicleInfo });

  await createOrder({
    chatId,
    vin,
    type,
    paymentId: link.id,
  });

  const label = type === 'carfax' ? 'CARFAX Report' : 'CARFAX + Resumen Detallado';

  await bot.sendMessage(chatId,
    `✅ *${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}*\n` +
    `VIN: \`${vin}\`\n\n` +
    `📋 Producto: *${label}*\n\n` +
    `Haz clic en el botón para completar tu pago:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '💳 Pagar Ahora', url: link.url }
        ]]
      }
    }
  );
}

module.exports = { handlePayment };
