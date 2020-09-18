const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });

const ScrapeAttempt = mongoose.Model(require('./scrape-attempt'));

function getUrlsToScrape() {
  return Promise.resolve([
    {
      url: 'example.com',
      type: 'html|pdf',
    },
  ]);
}

function getMostRecentAttempt(forUrl) {
  return Promise.resolve({
    timestamp: new Date(),
    url: forUrl,
    hash: 'some md5?',
    content: '<html><body>hello world</body></html>',
  });
}

function saveScrapeAttempt(forUrl, didChange, timestamp, type, hash, content) {
  // always record that an attempt occurred
  // only record results if didChange is true
  const success = true;
  return Promise.resolve(success);
}

function markUrlDefunct(url, timestamp) {
  const success = true;
  return Promise.resolve(success);
}

function getUsersToNotify() {
  return Promise.resolve([
    {
      name: 'First Last',
      email: 'foo@example.com',
    },
  ]);
}

module.exports = {
  getMostRecentAttempt,
  saveScrapeAttempt,
  markUrlDefunct,
  getUsersToNotify,
};
