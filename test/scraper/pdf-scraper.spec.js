const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const assert = require('assert');
const { hashPdf } = require('../../src/scraper/pdf');

describe('Pdf Scraper', function () {
  after(function () {
    mongoose.connection.close();
  });
  describe('#compareWithHash', function () {
    it('should return object with correct hash', async function () {
      let dataBuffer = fs.readFileSync('test/data/remotePDF.pdf');
      const pdf = await hashPdf(dataBuffer);
      assert.notEqual(pdf.hash, '262c87980f945f17d850e55439539499');
      assert.equal(pdf.hash, '0761019b03c4a4e3de6fe2c398f0a2fc');
    });
    it('should return object with error', async function () {
      const pdf = await hashPdf(null);
      assert.equal(pdf.error.type, 'pdf-parse');
      assert.equal(pdf.error.message, `Cannot read property 'url' of null`);
      assert.equal(pdf.hash, null);
    });
  });
});
