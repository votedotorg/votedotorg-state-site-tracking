const { Schema } = require('mongoose');

// no need for id
module.exports = new Schema({
    id: Number,
    email: String,
    name: String
});
