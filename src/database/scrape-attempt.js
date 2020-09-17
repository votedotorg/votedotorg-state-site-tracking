const { Schema } = require('mongoose');

module.exports = new Schema({
    scrapeItemId: Schema.ObjectId,
    scrapeStartDate: Date,
    scrapeEndDate: Date,
    runJobId: Schema.ObjectId, // updates for each scrape run
    status: String,
    errorInfo: String
});
