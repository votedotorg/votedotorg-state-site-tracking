const express = require('express');
const path = require('path');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());

app.use((req, res, next) => {
  next({ status: 404, message: `Unknown route ${req.path}` });
});

app.use((err, req, res, next) => {
  const error = req.app.get('env') === 'development' ? err : undefined;
  const message = err.message;
  res.status(err.status || 500).json({ message, error });
});

module.exports = app;
