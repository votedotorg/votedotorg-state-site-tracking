const diff = require('diff');
const cherio = require('cherio');
const extractText = require('html-to-text');

class HtmlScraper {
    compareVersions(url, currentHtml, previousHtml) {
        const currentText = this.extractText(currentHtml, url);
        const previousText = this.extractText(previousHtml, url);

        const changes = diff.diffSentences(previousText, currentText);
        const diffs = [];
        for(let i = 0; i < changes.length; i++) {
            // console.log(changes);
        }
        const pdfs = this.findLinksToPdfs(currentHtml)
        return { diffs, pdfs };
    }

    extractText(html, url) {
        return extractText.fromString(html, {
            wordwrap: 120,
            hideLinkHrefIfSameAsText: true,
            linkHrefBaseUrl: url,
        });
    }

    findLinksToPdfs(html) {
        return [];
    }
}

module.exports = HtmlScraper;