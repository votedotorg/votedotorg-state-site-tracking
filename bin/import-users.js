require('dotenv').config();

const fs = require('fs');
const chalk = require('chalk');
const csvParse = require('csv-parse');
const mongoose = require('mongoose');
const usersFile = 'misc/test-users.csv';
const MONGO_AUTH = process.env.MONGO_USER && process.env.MONGO_PASS ? `${process.env.MONGO_USER}:${process.env.MONGO_PASS}@` : '';
const MONGO_PROTO = process.env.MONGO_USER && process.env.MONGO_PASS ? 'mongodb+srv' : 'mongodb';
const connetionString = `${MONGO_PROTO}://${MONGO_AUTH}${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
const parser = csvParse({
  columns: true
});

const User = require('../src/database/user');

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

// cleanup previous users
const removeUsers = new Promise((resolve, reject) => {
  console.log(chalk.blue('Deleting users from the database...'));
  try {
    User.deleteMany({});
    console.log(chalk.blue('All Users successfully removed.'));
    return resolve('removeUsers');
  } catch (err) {
    console.error(chalk.red('Error deleting users:', err));
    return reject(err);
  }
});


// import users
const importUsers = new Promise((resolve, reject) => {
  let csvUserCount = 0;
  let dbUserCount = 0;
  const fd = fs.openSync(`${__dirname}/../${usersFile}`);
  fs.createReadStream(null, {
      fd: fd
    })
    .pipe(parser)
    .on('data', (row) => {
      // console.log('ROW:', row);
      if (!row.email) return;
      csvUserCount++;
      User.findOneAndUpdate({
          email: row.email
        }, {
          name: row.name,
          email: row.email
        }, {
          upsert: true
        },
        (err, savedUser) => {
          if (err) {
            console.error('Error saving user:', err);
            return reject(err);
          }
          console.info(chalk.blue('User saved:', savedUser._id, savedUser.name));
          dbUserCount++;
          if (csvUserCount === dbUserCount) {
            console.log(chalk.greenBright('Done updating users!'));
            return resolve('importUsers');
          }
        },
      );
    })
    .on('error', (err) => {
      console.error(err.message);
      return reject(err);
    })
    .on('end', () => {
      console.log(chalk.blue('Done importing user data from csv file!'));
    });
});

// Run imports
Promise.all([
  connectToDB,
  removeUsers,
  importUsers
]).then(values => {
  console.log('All done!', values);
  process.exit();
}).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});