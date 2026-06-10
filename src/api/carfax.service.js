const axios = require('axios');
const { CARFAX_API_KEY } = require('../config/env');

async function getCarfaxReport(vin) {
  const response = await axios.get('https://api.carfax.com/v1/report', {
    params: { vin },
    headers: {
      Authorization: `Bearer ${CARFAX_API_KEY}`,
      Accept: 'application/pdf',
    },
    responseType: 'arraybuffer',
  });

  return response.data;
}

module.exports = { getCarfaxReport };
