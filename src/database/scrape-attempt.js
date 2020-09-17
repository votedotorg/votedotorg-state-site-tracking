const { Schema } = require('mongoose');

module.exports = new Schema({
    type: String,
    timestamp: Date,
    url: String,
    hash: String,
    pdfs: [new Schema({ url: String, hash: String })],    // could have multiple pdf links on page
    content: String,
    enableScrape: Boolean,
    lastChangeDate: Date,
    lastRunJobId: Number, // updates for each scrape run
    lastRunStatus: String,
    lastRunErrorInfo: String
});
