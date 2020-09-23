const { notify } = require('../notifier');
const { startJob, evaluate } = require('../scraper');

class Scheduler {
  constructor(periodMs) {
    this.period = periodMs;
    this.run = this.run.bind(this);
  }

  async run() {
    //
    await startJob();

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
