const api = require('./api');
const mongoose = require('mongoose');

const port = process.env.PORT || 3000;
api.listen(port, () => {
  console.log(`Server started on ${port}`);

  // TODO: this makes the tests hang forever because we don't have a way to shut the connection down
  // mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
  mongoose.connect(
    'mongodb+srv://vote-org-build:4Mj2ExE0ip4N6QaJ@vote-org.k63d9.mongodb.net/voteorg?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true },
  );

  //Get the default connection
  const connection = mongoose.connection;
  connection.once('open', function () {
    console.log('MongoDB database connection established successfully');
  });
  connection.on('error', function () {
    console.log('Error connecting to MongoDB database');
  });

  const Scheduler = require('./scheduler');
  const s = new Scheduler(60 * 60 * 1000);
  s.start();
});
