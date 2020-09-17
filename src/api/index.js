const express = require('express');
const path = require('path');

const app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());

// add route handlers here
app.get('/hello', (req, res, next) => {
    res.send('Hello world');
})

app.get('/view', (req, res) => {
    res.render('example');
})

app.get('/err', (req, res, next) => {
    next('Not today');
})

app.use((req, res, next) => {
    next({ status: 404, message: `Unknown route ${req.path}`})
})

app.use((err, req, res, next) => {
    const error = req.app.get('env') === 'development' ? err : undefined;
    const message = err.message
    res.status(err.status || 500).json({ message, error })
})

module.exports = app;