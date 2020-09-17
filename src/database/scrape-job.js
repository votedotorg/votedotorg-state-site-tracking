const { Schema } = require('mongoose');

module.exports = new Schema({
    id: Number,
    schedule: String,   // cron entry etc
    lastRunDate: Date,
    status: String,   // succ/fail
    errorInfo: String
});
