const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// a user is for email notification
let user = new Schema({
  email: String,
  name: String,
});

module.exports = mongoose.model('User', user);
