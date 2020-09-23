const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// a scrape job is saved after all scrape attempts (based on each scrape item) have completed
// mark as failed if all scrape attempts do not complete
let scrapeJob = new Schema({
  startDate: Date,
  endDate: Date,
  status: String, // success or failed
});

module.exports = mongoose.model('ScrapeJob', scrapeJob);
