require('dotenv').config()

const fs = require('fs');
const chalk = require('chalk');
const csvParse = require('csv-parse');
const mongoose = require('mongoose');
const rawSourceFile = 'misc/2020-09-16-vdo-state-urls.csv';
const connetionString = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
const parser = csvParse({ columns: true });

let output = [];

mongoose.connect(connetionString, {useNewUrlParser: true});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log(chalk.blue("we're connected!"));
});


fs.createReadStream(`${__dirname}/../${rawSourceFile}`)
    .pipe(parser)
    .on('data', row => {
        console.log('ROW:', row);
        output.push(row);
    })
    .on('error', err => {
        console.error(err.message);
    })
    .on('end', () => {
        console.log(chalk.blue('Done importing data from csv file!'));
    });
