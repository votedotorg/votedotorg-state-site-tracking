const api = require('./api');

const port = process.env.PORT || 3000;
api.listen(port, () => {
    console.log(`Server started on ${port}`);
});

const Scheduler = require('./scheduler');
const s = new Scheduler(60 * 60 * 1000)
s.start()