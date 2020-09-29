const pdfParser = require('pdf-parse');
const axios = require('axios');
const crypto = require('crypto');

/**
 * returns a hash of the pdf's text
 * @param {buffer} data of the pdf
 */
async function hashPdf(data) {
  try {
    const pdf = await pdfParser(data, { version: 'v2.0.550' });
    const hash = crypto.createHash('md5').update(pdf.text).digest('hex');
    return { hash, error: null };
  } catch (error) {
    return { hash: null, error: { type: 'pdf-parse', message: error.message } };
  }
}

module.exports = {
  hashPdf,
};
