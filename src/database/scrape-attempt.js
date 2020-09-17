const { Schema } = require('mongoose');

module.exports = new Schema({
    timestamp: Date,
    url: String,
    hash: String,
    content: String
});