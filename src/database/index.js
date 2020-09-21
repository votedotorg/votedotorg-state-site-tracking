const mongoose = require('mongoose');
const ScrapeItem = require('./scrape-item');
const User = require('./user');
const ScrapeJob = require('./scrape-job');
const ScrapeAttempt = require('./scrape-attempt');

const { MONGODB_URL: mongoDBUrl } = process.env.NODE_ENV === 'production' ? process.env : require('./config');

// TODO: this makes the tests hang forever because we don't have a way to shut the connection down
// mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
mongoose.connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

//Get the default connection
const connection = mongoose.connection;
connection.once('open', function () {
  console.log('MongoDB database connection established successfully');
});
connection.on('error', function () {
  console.log('Error connecting to MongoDB database');
});

async function loadItemsToScrape() {
  return await ScrapeItem.find({});
}

async function findItemToScrape(queryObj) {
  return await ScrapeItem.findOne(queryObj);
}

async function getUsersToNotify() {
  const users = await User.find({});
  return users;
}

async function createScrapeJob(startDate) {
  const newScrapeJob = new ScrapeJob({
    startDate: startDate,
    status: 'fail',
  });
  return await newScrapeJob.save();
}

async function updateScrapeJob(id, endDate) {
  return await ScrapeJob.findByIdAndUpdate(
    { _id: id },
    {
      endDate: endDate,
      status: 'success',
    },
    { new: true }, // return updated model
    function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('Scrape job updated succussfully!');
      }
    },
  );
}

async function getScrapeJobs() {
  const scrapeJobs = await ScrapeJob.find({});
  return scrapeJobs;
}

async function clearScrapeJobs() {
  await ScrapeJob.deleteMany({}, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Scrape jobs cleared succussfully!');
    }
  });
}

async function createScrapeAttempt(itemId, startDate, runJobId) {
  // always record that an attempt occurred
  // only record results if didChange is true
  const newScrapeAttempt = new ScrapeAttempt({
    scrapeItemId: itemId,
    scrapeStartDate: startDate,
    runJobId: runJobId, // updates for each scrape run
    status: 'success',
    errorInfo: '',
  });
  return await newScrapeAttempt.save();
}

async function updateScrapeAttempt(id, scrapeEndDate, errorInfo) {
  return await ScrapeAttempt.findByIdAndUpdate(
    { _id: id },
    {
      //scrapeEndDate: scrapeEndDate,
      //status: ,
      //errorInfo: errorInfo,
    },
    { new: true }, // return updated model
    function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('Scrape item updated succussfully!');
      }
    },
  );
}

async function updateScrapeItem(id) {
  return await ScrapeItem.findByIdAndUpdate(
    { _id: id },
    {
      //hash: ,
      //pdfs: ,
      //content: ,
      //lastChangeDate: ,
      //lastChangeJobId: ,
    },
    { new: true }, // return updated model
    function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('Scrape item updated succussfully!');
      }
    },
  );
}

module.exports = {
  loadItemsToScrape,
  findItemToScrape,
  getUsersToNotify,
  createScrapeJob,
  updateScrapeJob,
  getScrapeJobs,
  clearScrapeJobs,
  createScrapeAttempt,
  updateScrapeAttempt,
  updateScrapeItem,
};
