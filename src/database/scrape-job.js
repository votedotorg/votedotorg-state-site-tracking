const { Schema } = require('mongoose');

module.exports = new Schema({
    schedule: String,   // cron entry etc
    lastRunDate: Date,
    status: String,   // succ/fail
    errorInfo: String
});
