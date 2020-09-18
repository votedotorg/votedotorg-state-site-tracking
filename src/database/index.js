const mongoose = require('mongoose');

const { MONGODB_URL: mongoDBUrl } = process.env.NODE_ENV === 'production' ? process.env : require('./config');

// TODO: this makes the tests hang forever because we don't have a way to shut the connection down
// mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
mongoose.connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
const connection = mongoose.connection;
connection.once('open', function () {
  console.log('MongoDB database connection established successfully');
});
connection.on('error', function () {
  console.log('Error connecting to MongoDB database');
});

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
  const ScrapeAttempt = require('./scrape-attempt');
  // always record that an attempt occurred
  // only record results if didChange is true
  return new ScrapeAttempt({
    scrapeItemId: Schema.ObjectId,
    scrapeStartDate: timestamp,
    scrapeEndDate: Date.now(),
    runJobId: Schema.ObjectId, // updates for each scrape run
    status: 'success',
    errorInfo: '',
  }).save();
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
