const { Schema } = require('mongoose');

module.exports = new Schema({
    ts: Date,
    url: String,
    hash: String,
    content: String
});