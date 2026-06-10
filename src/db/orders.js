const { Pool } = require('pg');
const { DATABASE_URL } = require('../config/env');

const pool = new Pool({ connectionString: DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      chat_id BIGINT NOT NULL,
      vin VARCHAR(17) NOT NULL,
      type VARCHAR(50) NOT NULL,
      payment_id VARCHAR(255) UNIQUE,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function createOrder({ chatId, vin, type, paymentId }) {
  const result = await pool.query(
    `INSERT INTO orders (chat_id, vin, type, payment_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [chatId, vin, type, paymentId]
  );
  return result.rows[0];
}

async function getOrderByPaymentId(paymentId) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE payment_id = $1',
    [paymentId]
  );
  return result.rows[0];
}

async function updateOrderStatus(paymentId, status) {
  await pool.query(
    'UPDATE orders SET status = $1 WHERE payment_id = $2',
    [status, paymentId]
  );
}

module.exports = { initDB, createOrder, getOrderByPaymentId, updateOrderStatus };
