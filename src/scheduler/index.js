const { notify } = require('../notifier');
const { startJob, resetScrapeItems } = require('../scraper');

class Scheduler {
  constructor(periodMs) {
    this.period = periodMs;
    this.run = this.run.bind(this);
  }

  async run() {
    // DEBUG: uncomment to reset scrape items back to initial state
    //await resetScrapeItems();

    // start the scrape job
    const { changes, lastScrapeJob } = await startJob();

    // send changes to notifier, set third param to true for testing notification email
    await notify(changes, lastScrapeJob, true);

    this.stop();
  }

  start() {
    // temporarily disable interval
    //this.interval = setInterval(this.run, this.period);
    this.run();
  }

  stop() {
    //clearInterval(this.interval);
    process.exit();
  }
}

module.exports = Scheduler;
