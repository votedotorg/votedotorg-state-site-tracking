const { Schema } = require('mongoose');

// no need for id
module.exports = new Schema({
    id: Number,
    scrapeId: Number,
    lastNotifyDate: Date,
    lastChangeJobId: Number
});
