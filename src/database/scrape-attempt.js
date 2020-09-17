const { Schema } = require('mongoose');

module.exports = new Schema({
    id: Number,
    type: String,
    timestamp: Date,
    url: String,  // refId: html link or reference pdf file
    hash: String,
    content: String,
    enableScrape: Boolean,
    lastChangeDate: Date,
    lastRunJobId: Number, //updates for each scrape run
    lastRunStatus: String,
    lastRunErrorInfo: String
});
