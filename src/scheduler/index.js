const Notifier = require("../notifier");
const HtmlScraper = require("../scraper/html");
const PdfScraper = require("../scraper/pdf");

class Scheduler {
    constructor(periodMs) {
        this.period = periodMs;
        this.run = this.run.bind(this);
    }
    run() {
        const html = new HtmlScraper();
        const pdf = new PdfScraper();

        // fetch html urls to scrape from the db
        const changes = [];
        const urls = [];

        for(let i = 0; i < urls.length; i++) {
            
        }

        const notifer = new Notifier();
        notifer.notify(changes);
    }
    start() {
        this.interval = setInterval(this.run, this.periodMs)
        this.run();
    }
    stop() {
        clearInterval(this.interval);
    }
}

module.exports = Scheduler;