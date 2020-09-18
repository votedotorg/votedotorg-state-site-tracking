const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let scrapeJob = new Schema({
  runDate: Date,
  status: String, // succ/fail
  errorInfo: String,
});

module.exports = mongoose.model('ScrapeJob', scrapeJob);
