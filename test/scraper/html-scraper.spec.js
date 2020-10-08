const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const assert = require('assert');
const { compareVersions, extractText } = require('../../src/scraper/html');

const BASE_URL = 'https://www.sos.alabama.gov/alabama-votes/voter/register-to-vote';

describe('Html Scraper', function () {
  after(function () {
    mongoose.connection.close();
  });

  describe('#extractText', function () {
    it('should extract text from a single node', function () {
      const text = extractText(`<html><body>Hello World</body></html>`);
      assert.equal(text, 'Hello World');
    });

    it('should extract text from a webpage', function () {
      const text = extractText(textOfFile('alabama-sos.html'), BASE_URL);
      assert.equal(text, textOfFile('alabama-sos.txt'), 'Alabama page to text');
    });
  });

  describe('#compareVersions', function () {
    it('should return diffs with context', function () {
      const newHtml = textOfFile('alabama-sos-min-2.html');
      const oldHtml = textOfFile('alabama-sos-min-1.html');
      const { diffs } = compareVersions('', newHtml, oldHtml);
      assert.deepEqual(
        diffs,
        [
          {
            pre: '',
            current: 'Thank you for your disinterest in registering to vote.',
            prior: 'Thank you for your interest in registering to vote.',
            post: 'We are glad to be of assistance.',
          },
          {
            current: 'Then, just eat it, fill it out, and\nmail it in to your local board of registrars!',
            post:
              "Any individual registering to vote must send the completed application\nwith his/her original signature to the county'sBoard of Registrars\n[http://sos.",
            pre: 'You may download theState of Alabama Mail-In Voter Registration Formfrom this page.',
            prior: 'Then, just print it, fill it out,\nand mail it in to your local board of registrars!',
          },
        ],
        "didn't diff files",
      );
    });
    it('should return links to pdfs', function () {
      const newHtml = textOfFile('alabama-sos-min-2.html');
      const oldHtml = textOfFile('alabama-sos-min-1.html');
      const { pdfs } = compareVersions(BASE_URL, newHtml, oldHtml);
      assert.deepEqual(
        pdfs,
        [
          `https://www.sos.alabama.gov/sites/default/files/voter-pdfs/nvra-2.pdf`,
          `https://www.sos.alabama.gov/sites/default/files/voter-pdfs/Domestic_Violence_Affidavit.pdf`,
        ],
        "didn't return pdf list",
      );
    });
  });

  describe('#findLinksToPdfs', function () {
    it('should do stuff');
  });
});

function textOfFile(fileName) {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  return fs.readFileSync(filePath, { encoding: 'utf-8' });
}
