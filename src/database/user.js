const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let user = new Schema({
  email: String,
  name: String,
});

module.exports = mongoose.model('User', user);
