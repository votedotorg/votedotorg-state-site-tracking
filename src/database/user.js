const { Schema } = require('mongoose');

// no need for id
module.exports = new Schema({
    email: String,
    name: String
});
