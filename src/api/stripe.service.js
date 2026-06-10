const Stripe = require('stripe');
const { STRIPE_SECRET_KEY } = require('../config/env');

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PRICES = {
  carfax: 2499,
  carfax_detailed: 3999,
};

async function createCheckoutSession({ chatId, vin, type, vehicleInfo }) {
  const amount = PRICES[type];
  const label = type === 'carfax' ? 'CARFAX Report' : 'CARFAX + Detailed Summary';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${label} — ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
            description: `VIN: ${vin}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'https://mendez-vehicle-reports.up.railway.app/success',
    cancel_url: 'https://mendez-vehicle-reports.up.railway.app/cancel',
    metadata: { chatId: String(chatId), vin, type },
  });

  return session;
}

module.exports = { createCheckoutSession };
