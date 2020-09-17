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
        const urls = [];
        const pages = urls.filter(u => false);
        const knownPdfs = urls.filter(u => false);
        
        const changes = [];
        const currentPdfs = [];
        for(let i = 0; i < pages.length; i++) {
            // diff html
            // find pdfs
        }
        // compute intersection of currentPdfs and knownPdfs
        // add a change for new pdfs and retired pdfs
        for (let i = 0; i < knownPdfs.length; i++) {
            // diff pdfs
            // somehow notify missing pdfs
        }

        const notifier = new Notifier();
        //notifier.notify(changes);
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