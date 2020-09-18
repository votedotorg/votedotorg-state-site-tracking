const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const assert = require('assert');
const { hashPdf } = require('../../src/scraper/pdf');

const PDF_REMOTE_URL =
  'https://github.com/BruceBGordon/votedotorg-state-site-tracking/raw/master/test/data/remotePDF.pdf';

describe('Pdf Scraper', function () {
  after(function () {
    mongoose.connection.close();
  });
  describe('#compareWithHash', function () {
    xit('should return array with remote pdf url', async function () {
      let pdfsToCompare = [
        {
          hash: '262c87980f945f17d850e55439539499',
          url: PDF_REMOTE_URL,
        },
        {
          hash: '0761019b03c4a4e3de6fe2c398f0a2fc',
          url: PDF_REMOTE_URL,
        },
      ];
      const pdf = await hashPdf(PDF_REMOTE_URL);
      console.log(pdf);
      assert.notEqual(pdf.hash, pdfsToCompare[0].hash);
      assert.equal(pdf.hash, pdfsToCompare[1].hash);
    });
  });
});
