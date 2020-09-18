const url = require('url');
const cherio = require('cherio');
const extractText = require('html-to-text');
const { diffText } = require('./text');

class HtmlScraper {
  compareVersions(url, currentHtml, previousHtml) {
    const currentText = this.extractText(currentHtml, url);
    const previousText = this.extractText(previousHtml, url);

    const diffs = diffText(previousText, currentText);
    const pdfs = this.findLinksToPdfs(currentHtml, url);
    return { diffs, pdfs };
  }

  extractText(html, url) {
    return extractText.fromString(html, {
      wordwrap: 120,
      hideLinkHrefIfSameAsText: true,
      linkHrefBaseUrl: url,
    });
  }

  findLinksToPdfs(html, baseUrl) {
    const $ = cherio.load(html);
    const urls = [];
    $('a').each((i, el) => urls.push($(el).attr('href')));
    return urls
      .filter((href) => href.endsWith('.pdf'))
      .map((href) => (isRelative(href) ? url.resolve(baseUrl, href) : href));
  }
}

function isRelative(path) {
  return path.startsWith('.') || (path.startsWith('/') && !path.startsWith('//'));
}

module.exports = HtmlScraper;
