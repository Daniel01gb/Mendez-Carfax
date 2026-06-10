const { getCarfaxReport } = require('../../api/carfax.service');
const { getOrderByPaymentId, updateOrderStatus } = require('../../db/orders');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deliverReport(bot, paymentId) {
  const order = await getOrderByPaymentId(paymentId);
  if (!order || order.status === 'completed') return;

  await updateOrderStatus(paymentId, 'processing');

  await bot.sendMessage(order.chat_id,
    `✅ *Pago recibido*\n\nEstamos generando tu reporte, te lo enviaremos en unos momentos...`,
    { parse_mode: 'Markdown' }
  );

  let pdfBuffer = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      pdfBuffer = await getCarfaxReport(order.vin);
      break;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  if (!pdfBuffer) {
    await updateOrderStatus(paymentId, 'failed');
    await bot.sendMessage(order.chat_id,
      `⚠️ *Hubo un problema generando tu reporte*\n\nTu pago fue recibido correctamente. Un representante de Mendez Carfax te contactará pronto para enviarte el reporte manualmente.\n\nDisculpa el inconveniente.`,
      { parse_mode: 'Markdown' }
    );
    console.error(`Error entregando reporte para VIN ${order.vin}:`, lastError?.message);
    return;
  }

  await bot.sendDocument(order.chat_id, Buffer.from(pdfBuffer), {
    caption: `✅ *Tu reporte está listo*\n\nVIN: \`${order.vin}\`\n\nGracias por usar *Mendez Carfax*.`,
    parse_mode: 'Markdown',
  }, {
    filename: `MendezCarfax_${order.vin}.pdf`,
    contentType: 'application/pdf',
  });

  await updateOrderStatus(paymentId, 'completed');
}

module.exports = { deliverReport };
