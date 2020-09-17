const fs = require('fs');
const path = require('path')
const cherio = require('cherio');
const extractText = require('html-to-text');

const assert = require('assert');
const HtmlScraper = require('../src/scraper/html');

describe('Html Scraper', function () {
    const scraper = new HtmlScraper();

    describe.skip('#extractText', function () {
        it('should extract text from a single node', function () {
            const text = scraper.extractText(`<html><body>Hello World</body></html>`);
            assert.equal(text, 'Hello World')
        });

        it('should extract text from a webpage', function () {
            const text = scraper.extractText(textOfFile('alabama-sos.html'), 'https://www.sos.alabama.gov/alabama-votes/voter/register-to-vote')
            assert.equal(text, textOfFile('alabama-sos.txt'), 'Alabama page to text')
        })
    });

    describe('#compareVersions', function() {
        it('should return diffs with context', function() {
            const newHtml = textOfFile('alabama-sos-min-2.html');
            const oldHtml = textOfFile('alabama-sos-min-1.html');
            const {diffs} = scraper.compareVersions('', newHtml, oldHtml)
            assert.deepEqual(diffs, [

            ], "didn't diff files")
        });
        it('should return ')
    })

    describe('#findLinksToPdfs', function () {
        it('should do stuff')
    })
});

function textOfFile(fileName) {
    const filePath = path.join(__dirname, 'data', fileName);
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
}
