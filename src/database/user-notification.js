const { Schema } = require('mongoose');

// no need for id
module.exports = new Schema({
    scrapeId: ObjectId,
    lastNotifyDate: Date,
    lastChangeJobId: Number
});
