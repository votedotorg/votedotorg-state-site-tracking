require('dotenv').config();

const fs = require('fs');
const chalk = require('chalk');
const csvParse = require('csv-parse');
const mongoose = require('mongoose');
const rawSourceFile = 'misc/2020-09-16-vdo-state-urls.csv';
const MONGO_AUTH = process.env.MONGO_USER && process.env.MONGO_PASS ? `${process.env.MONGO_USER}:${process.env.MONGO_PASS}@` : '';
const MONGO_PROTO = process.env.MONGO_USER && process.env.MONGO_PASS ? 'mongodb+srv' : 'mongodb';
const connetionString = `${MONGO_PROTO}://${MONGO_AUTH}${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
const parser = csvParse({
  columns: true
});

const ScrapeItem = require('../src/database/scrape-item');

console.log(chalk.bgYellow.black(`will connect to mongodb at ${connetionString}`));

mongoose.connect(connetionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const db = mongoose.connection;

const connectToDB = new Promise((resolve, rejecct) => {
  db.on('error', (err) => {
    console.error(chalk.red('connection error:', err));
    return rejects(err);
  });
  db.once('open', () => {
    console.log(chalk.blue("we're connected!"));
    return resolve('connectToDB');
  });
});

// Import scrape items
const importScrapeItems = new Promise((resolve, reject) => {
  let csvItemCount = 0;
  let dbItemCount = 0;
  const fd = fs.openSync(`${__dirname}/../${rawSourceFile}`, 'r');
  fs.createReadStream(`${__dirname}/../${rawSourceFile}`, {
      fd: fd
    })
    .pipe(parser)
    .on('data', (row) => {
      // console.log('ROW:', row);
      if (!row['State abbr']) return;
      csvItemCount++;
      const {
        'Absentee Info URL': absenteeInfo,
        'General Election Page URL': generalElection
      } = row;

      [absenteeInfo, generalElection].forEach((categoryUrl, index) => {
        let itemType = categoryUrl.includes('.pdf') ? 'pdf' : 'html';
        const category = index === 0 ? 'AbsenteeInfo' : 'GeneralElection';
        ScrapeItem.findOneAndUpdate({
            state: row['State abbr'],
            category: category
          }, {
            type: itemType,
            state: row['State abbr'],
            category: category,
            url: categoryUrl,
            disableScrape: false,
          }, {
            upsert: true
          },
          (err, savedItem) => {
            if (err) {
              console.error('Error saving item:', err);
              return reject(err);
            }
            if (savedItem) console.log(chalk.blue('Item saved:', savedItem._id, savedItem.state, savedItem.category));
            dbItemCount++;
            if (csvItemCount === dbItemCount) {
              console.log(chalk.greenBright('Done updating items!'));
              return resolve('importScrapeItems');
            }
          },
        );
      });
    })
    .on('error', (err) => {
      console.error(err.message);
      return reject(err);
    })
    .on('end', () => {
      console.log(chalk.blue('Done importing scrape item data from csv file!'));
    });
});

// Run imports
Promise.all([
  connectToDB,
  importScrapeItems,
]).then(values => {
  console.log('All done!', values);
  process.exit();
}).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});