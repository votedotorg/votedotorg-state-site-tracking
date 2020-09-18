require('dotenv').config()

const fs = require('fs');
const chalk = require('chalk');
const csvParse = require('csv-parse');
const mongoose = require('mongoose');
const rawSourceFile = 'misc/2020-09-16-vdo-state-urls.csv';
const usersFile = 'misc/test-users.csv';
const connetionString = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
const parser = csvParse({ columns: true });

const ScrapeItemSchema = require('../src/database/scrape-item');
const ScrapeItem = mongoose.model('ScrapeItem', ScrapeItemSchema);

const UserSchema = require('../src/database/user');
const User = mongoose.model('User', UserSchema);

mongoose.connect(connetionString, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log(chalk.blue("we're connected!"));
});

// Import scrape items
const importScrapeItems = () => {
    fs.createReadStream(`${__dirname}/../${rawSourceFile}`)
        .pipe(parser)
        .on('data', row => {
            // console.log('ROW:', row);
            if (!row['State abbr']) return;
            const { 'Absentee Info URL': absenteeInfo, 'General Election Page URL': generalElection } = row;
            
            [ absenteeInfo, generalElection ].forEach((categoryUrl, index) => {
                const category = index === 0 ? 'AbsenteeInfo' : 'GeneralElection';
                ScrapeItem.findOneAndUpdate(
                    { state: row['State abbr'], category: category },
                    {
                        state: row['State abbr'],
                        category: category,
                        url: categoryUrl,
                    },
                    { upsert: true },
                    (err, savedItem) => {
                        if (err) return console.error('Error saving item:', err);
                        console.info(chalk.blue('Item saved:', savedItem));
                    }
                );
            });
        })
        .on('error', err => {
            console.error(err.message);
        })
        .on('end', () => {
            console.log(chalk.blue('Done importing scrape item data from csv file!'));
        });
};


// import users
const importUsers = () => {
    fs.createReadStream(`${__dirname}/../${usersFile}`)
        .pipe(parser)
        .on('data', row => {
            // console.log('ROW:', row);
            if (!row.email) return;
            User.findOneAndUpdate(
                { email: row.email },
                { name: row.name, email: row.email },
                { upsert: true },
                (err, savedUser) => {
                    if (err) return console.error('Error saving user:', err);
                    console.info(chalk.blue('User saved:', savedUser));
                }
            );
        })
        .on('error', err => {
            console.error(err.message);
        })
        .on('end', () => {
            console.log(chalk.blue('Done importing user data from csv file!'));
        });
};


// Run imports
importScrapeItems();
importUsers();


