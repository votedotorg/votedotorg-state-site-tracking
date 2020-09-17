const { Schema } = require('mongoose');

module.exports = new Schema({
    type: String,
    timestamp: Date,
    urls: [new Schema({ url: String, hash: String })],  // url: html link or reference pdf file
    content: String,
    enableScrape: Boolean,
    lastChangeDate: Date,
    lastRunJobId: Number, // updates for each scrape run
    lastRunStatus: String,
    lastRunErrorInfo: String
});
