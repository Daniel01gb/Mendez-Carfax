const { Client, Environment } = require('square');
const { randomUUID } = require('crypto');
const { SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID } = require('../config/env');

const client = new Client({
  accessToken: SQUARE_ACCESS_TOKEN,
  environment: Environment.Production,
});

const PRICES = {
  carfax: 2499n,
  carfax_detailed: 3999n,
};

async function createPaymentLink({ chatId, vin, type, vehicleInfo }) {
  const amount = PRICES[type];
  const label = type === 'carfax' ? 'CARFAX Report' : 'CARFAX + Resumen Detallado';

  const response = await client.checkoutApi.createPaymentLink({
    idempotencyKey: randomUUID(),
    order: {
      locationId: SQUARE_LOCATION_ID,
      lineItems: [
        {
          name: `${label} — ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
          quantity: '1',
          note: `VIN: ${vin} | Chat: ${chatId}`,
          basePriceMoney: { amount, currency: 'USD' },
        },
      ],
    },
    checkoutOptions: {
      redirectUrl: 'https://mendez-carfax.up.railway.app/success',
    },
  });

  const link = response.result.paymentLink;
  return { id: link.orderId, url: link.url };
}

module.exports = { createPaymentLink };
