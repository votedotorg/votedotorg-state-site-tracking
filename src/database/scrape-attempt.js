const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// scrape attempt on a specific scrape item
let scrapeAttempt = new Schema({
  scrapeItemId: Schema.ObjectId,
  scrapeStartDate: Date,
  scrapeEndDate: Date,
  runJobId: Schema.ObjectId, // updates for each scrape run
  status: String,
  errorInfo: String,
});

module.exports = mongoose.model('ScrapeAttempt', scrapeAttempt);
