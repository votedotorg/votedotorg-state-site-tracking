//

async function loadItemsToScrape() {
  const ScrapeItem = require('./scrape-item');
  const scrapeItems = await ScrapeItem.find({});
  return scrapeItems;
}

async function getUsersToNotify() {
  const User = require('./user');
  const users = await User.find({});
  return users;
}

async function getMostRecentAttempt(forUrl) {
  return Promise.resolve({
    timestamp: new Date(),
    url: forUrl,
    hash: 'some md5?',
    content: '<html><body>hello world</body></html>',
  });
}

async function saveScrapeAttempt(forUrl, didChange, timestamp, type, hash, content) {
  // always record that an attempt occurred
  // only record results if didChange is true
  const success = true;
  return Promise.resolve(success);
}

async function markUrlDefunct(url, timestamp) {
  const success = true;
  return Promise.resolve(success);
}

module.exports = {
  loadItemsToScrape,
  getUsersToNotify,
  getMostRecentAttempt,
  saveScrapeAttempt,
  markUrlDefunct,
};
