const express = require('express');
const crypto = require('crypto');
const { SQUARE_WEBHOOK_SIGNATURE_KEY, PORT } = require('./src/config/env');
const { deliverReport } = require('./src/bot/handlers/report');
const { initDB } = require('./src/db/orders');

const app = express();

require('./src/bot/index');

function verifySquareSignature(body, signature, url) {
  const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY);
  hmac.update(url + body);
  return hmac.digest('base64') === signature;
}

app.post('/webhook/square', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-square-hmacsha256-signature'];
  const webhookUrl = `${req.protocol}://${req.get('host')}/webhook/square`;
  const rawBody = req.body.toString('utf8');

  if (!verifySquareSignature(rawBody, signature, webhookUrl)) {
    console.error('Square webhook: firma inválida');
    return res.status(400).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).send('Invalid JSON');
  }

  if (event.type === 'payment.completed') {
    const orderId = event.data?.object?.payment?.order_id;
    if (orderId) {
      try {
        await deliverReport(require('./src/bot/index'), orderId);
      } catch (err) {
        console.error('Error entregando reporte:', err.message);
      }
    }
  }

  res.json({ received: true });
});

app.use(express.json());

app.get('/success', (req, res) => {
  res.send('<h2>✅ Pago recibido. Tu reporte será enviado por Telegram en instantes.</h2>');
});

app.get('/cancel', (req, res) => {
  res.send('<h2>❌ Pago cancelado. Regresa al bot para intentarlo de nuevo.</h2>');
});

app.get('/', (req, res) => {
  res.send('Mendez Carfax — Bot activo ✅');
});

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('Error iniciando base de datos:', err.message);
    process.exit(1);
  });
