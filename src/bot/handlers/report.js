const { getCarfaxReport } = require('../../api/carfax.service');
const { getOrderByPaymentId, updateOrderStatus } = require('../../db/orders');

async function deliverReport(bot, paymentId) {
  const order = await getOrderByPaymentId(paymentId);
  if (!order || order.status === 'completed') return;

  await updateOrderStatus(paymentId, 'processing');

  const pdfBuffer = await getCarfaxReport(order.vin);

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
