const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const assert = require('assert');
const { getSiteContent, getPDFHashes } = require('../../src/scraper/index');

var mock = new MockAdapter(axios);

describe('Scraper', function () {
  before(function () {
    mock.reset();
  });
  after(function () {
    mongoose.connection.close();
  });
  describe('#getSiteContent', function () {
    const items = [
      {
        type: 'html',
        state: 'AL',
        category: 'General Election',
        url: 'https://www.sos.alabama.gov/alabama-votes/voter/register-to-vote',
        hash: '',
        pdfs: [{ url: '', hash: '' }],
        content: '',
        disableScrape: false,
        lastChangeDate: undefined,
      },
      {
        type: 'pdf',
        state: 'MD',
        category: 'General Election',
        url: 'https://elections.maryland.gov/about/documents/Agenda_10_08_2020.pdf',
        hash: '',
        pdfs: [{ url: '', hash: '' }],
        content: '',
        disableScrape: false,
        lastChangeDate: undefined,
      },
    ];

    it('should get html content and pdf data', async function () {
      mock.onGet(items[0].url).reply(200, 'html content').onGet(items[1].url).reply(200, 'pdf data');
      const itemsAndContent = await getSiteContent(items);
      assert.equal(itemsAndContent[0].content, 'html content');
      assert.equal(itemsAndContent[1].content.data, 'pdf data');
    });

    it('should not get html content and pdf data', async function () {
      mock.onGet(items[0].url).reply(500).onGet(items[1].url).reply(500);
      const itemsAndContent = await getSiteContent(items);
      assert.equal(itemsAndContent[0].content, null);
      assert.equal(itemsAndContent[1].content, null);
    });
  });

  describe('#getPDFHashes', function () {
    const pdfUrls = [
      'https://www.votespa.com/Resources/Documents/Authorize-Designated-Agent-for-Mail-in-or-Absentee-Ballot.pdf',
      'https://www.elections.ny.gov/NYSBOE/download/finance/WindingDownTheCampaign2020.pdf',
    ];

    it('should get pdf hashes', async function () {
      let dataBuffer1 = fs.readFileSync('test/data/remotePDF.pdf');
      let dataBuffer2 = fs.readFileSync('test/data/simple.pdf');

      mock.onGet(pdfUrls[0]).reply(200, dataBuffer1).onGet(pdfUrls[1]).reply(200, dataBuffer2);
      const pdfs = await getPDFHashes(pdfUrls);
      assert.equal(pdfs[0].hash, '0761019b03c4a4e3de6fe2c398f0a2fc');
      assert.equal(pdfs[1].hash, 'a81bbe07ba600f847db4fe43d5729663');
    });

    it('should get html content and pdf data', async function () {
      mock.onGet(pdfUrls[0]).reply(500).onGet(pdfUrls[1]).reply(500);
      const pdfs = await getPDFHashes(pdfUrls);
      assert.equal(pdfs[0].hash, null);
      assert.equal(pdfs[0].error.type, 'axios');
      assert.equal(pdfs[1].hash, null);
      assert.equal(pdfs[1].error.type, 'axios');
    });
  });
});
