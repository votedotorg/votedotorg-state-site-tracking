const { Schema } = require('mongoose');

module.exports = new Schema({
    runDate: Date,
    status: String,   // succ/fail
    errorInfo: String
});
