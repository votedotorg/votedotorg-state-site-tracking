require('dotenv').config();

const MONGO_AUTH =
  process.env.MONGO_USER && process.env.MONGO_PASS ? `${process.env.MONGO_USER}:${process.env.MONGO_PASS}@` : '';
const MONGO_PROTO = process.env.MONGO_USER && process.env.MONGO_PASS ? 'mongodb+srv' : 'mongodb';

module.exports = {
  MONGODB_URL: `${MONGO_PROTO}://${MONGO_AUTH}${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`,
};
