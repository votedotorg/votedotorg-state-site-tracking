const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// a scrape item is a url page that can contain multiple pdfs
let scrapeItem = new Schema({
  type: String, // html or pdf
  state: String, // state CA, NV
  category: String, // AbsenteeInfo, GeneralElection
  url: String,
  hash: String, // if type is pdf then the hash is stored here
  pdfs: [new Schema({ url: String, hash: String })], // could have multiple pdf links on page
  content: String, // if type is html then the last HTML content is stored here
  disableScrape: { type: Boolean, default: false }, // default enabled for all
  lastChangeDate: Date,
  lastChangeJobId: Schema.ObjectId, // jobId of lastChange
});

module.exports = mongoose.model('ScrapeItem', scrapeItem);
