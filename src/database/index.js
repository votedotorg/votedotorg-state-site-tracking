const mongoose = require('mongoose');

// TODO: this makes the tests hang forever because we don't have a way to shut the connection down
// mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });

// TODO: this errors
// const ScrapeAttempt = mongoose.Model(require('./scrape-attempt'));

function loadItemsToScrape() {
  // fetch ScrapeItems
  return Promise.resolve([
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
