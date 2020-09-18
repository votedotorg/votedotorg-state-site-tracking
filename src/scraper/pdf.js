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
  axios
    .get(url, { responseType: 'arraybuffer' })
    .then(function (data) {
      pdfParser(data, options)
        .then(function (pdf) {
          const hash = crypto.createHash('md5').update(pdf.text).digest('hex');
          return { url, hash, error: '' };
        })
        .catch(function (error) {
          console.log('pdfParser error: ', error.message);
          return { url, hash: '', error: error.message };
        });
    })
    .catch(function (error) {
      console.log('axios error: ', error.message);
      return { url, hash: '', error: error.message };
    });
}

module.exports = {
  hashPdf,
};
