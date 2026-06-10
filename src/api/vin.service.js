const axios = require('axios');

async function decodeVIN(vin) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
  const { data } = await axios.get(url);

  const results = data.Results;
  const getValue = (variable) =>
    results.find((r) => r.Variable === variable)?.Value || null;

  const make = getValue('Make');
  const model = getValue('Model');
  const year = getValue('Model Year');
  const errorCode = getValue('Error Code');

  if (!make || errorCode === '8' || errorCode === '11') return null;

  return { make, model, year, vin };
}

module.exports = { decodeVIN };
