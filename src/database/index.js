const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});

module.exports = {
    ScrapeAttempt: mongoose.Model(require('./scrape-attempt'))
}