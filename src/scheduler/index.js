const { notify } = require('../notifier');
const {
  clearScrapeJobs,
  getScrapeJobs,
  loadItemsToScrape,
  findItemToScrape,
  createScrapeJob,
  updateScrapeJob,
} = require('../database');
const { evaluate } = require('../scraper');

class Scheduler {
  constructor(periodMs) {
    this.period = periodMs;
    this.run = this.run.bind(this);
  }

  async run() {
    // DEBUG: uncomment next line to clear all scrape jobs
    //const result = await clearScrapeJobs();

    // DEBUG: view the scrape jobs
    //const scrapeJobs = await getScrapeJobs();
    //console.log('Scrape jobs: ', scrapeJobs);

    // record the start of the scrape job
    const scrapeJobsStartDate = Date.now();
    console.log(`\n********** Started scrape job at ${new Date(scrapeJobsStartDate).toISOString()} **********\n`);
    let currentScrapeJob = await createScrapeJob(scrapeJobsStartDate);

    console.log('\n********** Loading scrape items from database **********\n');
    const items = await loadItemsToScrape();

    // DEBUG: find one item to scrape for testing
    //const items = [ await findItemToScrape({ state: 'CA' }) ];
    //console.log(items);

    const totalItems = items.length;
    console.log('\n********** Loaded ' + totalItems + ' scrape items **********\n');

    console.log('\n********** Start evaluating scrape items **********\n');
    const changes = [];
    for (let i = 0; i < totalItems; i++) {
      console.log('\n********** Evaluating scrape item ' + (i + 1) + ' of ' + totalItems + ' **********\n');
      // TODO: create scrape attempt
      const change = await evaluate(items[i]);
      // TODO: update scrape attempt and scrape items
      if (change) {
        console.log('\n********** Scrape item ' + (i + 1) + ' changed **********\n');
        changes.push(change);
      }
    }
    console.log('\n********** Done evaluating scrape items **********\n');

    // update scrape job to indicate it completed
    const scrapeJobsEndDate = Date.now();
    await updateScrapeJob(currentScrapeJob._id, scrapeJobsEndDate);

    console.log(`\n********** Completed scrape job at ${new Date(scrapeJobsEndDate).toISOString()} **********\n`);
    const scrapeJobTimeSec = parseInt((scrapeJobsEndDate - scrapeJobsStartDate) / 1000);
    //console.log('scrapeJobTimeSec', scrapeJobTimeSec);
    const scrapeJobTimeMin = parseInt(scrapeJobTimeSec / 60);
    console.log(`Scrape job compeleted in ${scrapeJobTimeMin} min ${scrapeJobTimeSec % 60} sec`);

    // send changes to notifier
    //notify(changes).then(function (data) {
    // exit for now
    //process.exit();
    //});
  }

  start() {
    // temporarily disable interval
    //this.interval = setInterval(this.run, this.periodMs);
    this.run();
  }

  stop() {
    //clearInterval(this.interval);
  }
}

module.exports = Scheduler;
