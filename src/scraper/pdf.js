const pdfParser = require('pdf-parse');
const axios = require('axios');
const crypto = require('crypto');

/**
 * fetches the pdf and takes a hash of the pdf's text
 * @param {string} url the url of the pdf
 */
async function hashPdf(url) {
  let options = {
    version: 'v2.0.550',
  };
  try {
    const data = await axios.get(url, { responseType: 'arraybuffer' });
    try {
      const pdf = await pdfParser(data, options);
      const hash = crypto.createHash('md5').update(pdf.text).digest('hex');
      return { url, hash, error: null };
    } catch (error) {
      return { url, hash: null, error: { type: 'pdf-parse', message: error.message } };
    }
  } catch (error) {
    return { url, hash: null, error: { type: 'axios', message: error.message } };
  }
}

module.exports = {
  hashPdf,
};
