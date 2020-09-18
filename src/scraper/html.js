const url = require('url');
const cherio = require('cherio');
const htmlToText = require('html-to-text');
const { diffText } = require('./text');

function compareVersions(url, currentHtml, previousHtml) {
  const currentText = extractText(currentHtml, url);
  const previousText = extractText(previousHtml, url);

  const diffs = diffText(previousText, currentText);
  const pdfs = findLinksToPdfs(currentHtml, url);
  return { diffs, pdfs };
}

function extractText(html, url) {
  return htmlToText.fromString(html, {
    wordwrap: 120,
    hideLinkHrefIfSameAsText: true,
    linkHrefBaseUrl: url,
  });
}

function findLinksToPdfs(html, baseUrl) {
  const $ = cherio.load(html);
  const urls = [];
  $('a').each((i, el) => urls.push($(el).attr('href')));
  return urls
    .filter((href) => href && href.endsWith('.pdf'))
    .map((href) => (isRelative(href) ? url.resolve(baseUrl, href) : href));
}

function isRelative(path) {
  // better detection for relative path urls since path may not start with '.' or '/'
  var r = new RegExp('^(?:[a-z]+:)?//', 'i');
  return !r.test(path);
}

module.exports = {
  compareVersions,
  extractText,
  findLinksToPdfs,
};
