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

async function loadItemsToScrape(queryObj) {
  return await ScrapeItem.find(queryObj);
}

async function getUsersToNotify() {
  const users = await User.find({});
  return users;
}

async function createScrapeJob(startDate) {
  const newScrapeJob = new ScrapeJob({
    startDate: startDate,
    status: 'failed',
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

// returns the latest successful scrape job
async function getLatestScrapeJob() {
  return await ScrapeJob.findOne({ status: 'success' }, {}, { sort: { created_at: -1 } }); //{ endDate: { $exists: true } }
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

async function createScrapeAttempt(itemId, startDate, runJobId, errorInfo) {
  const obj = {
    scrapeItemId: itemId,
    scrapeStartDate: startDate,
    runJobId: runJobId,
    status: 'failed',
  };
  if (errorInfo) {
    obj.errorInfo = errorInfo;
  }
  const newScrapeAttempt = new ScrapeAttempt(obj);
  return await newScrapeAttempt.save();
}

async function updateScrapeAttempt(id, scrapeEndDate, errorInfo) {
  const obj = { scrapeEndDate: scrapeEndDate };
  //if (errorInfo) {
  //  obj.errorInfo = errorInfo;
  //} else {
  obj.status = 'success';
  obj.errorInfo = '';
  //}
  return await ScrapeAttempt.findByIdAndUpdate(
    { _id: id },
    obj,
    { new: true }, // return updated model
    function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('Scrape attempt updated succussfully!');
      }
    },
  );
}

// returns the latest successful scrape job
async function getLatestScrapeAttempt() {
  return await ScrapeAttempt.findOne({ status: 'success' }, {}, { sort: { created_at: -1 } });
}

async function updateScrapeItem(id, obj) {
  return await ScrapeItem.findByIdAndUpdate(
    { _id: id },
    obj,
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

async function updateAllScrapeItems(obj) {
  return await ScrapeItem.update(
    {},
    { $set: obj },
    { multi: true }, // update multiple documents
    function (err, writeResult) {
      if (err) {
        console.error(err);
      } else {
        console.log('Scrape items updated succussfully!', writeResult);
      }
    },
  );
}

module.exports = {
  loadItemsToScrape,
  getUsersToNotify,
  createScrapeJob,
  updateScrapeJob,
  getLatestScrapeJob,
  getScrapeJobs,
  clearScrapeJobs,
  createScrapeAttempt,
  updateScrapeAttempt,
  getLatestScrapeAttempt,
  updateScrapeItem,
  updateAllScrapeItems,
};
