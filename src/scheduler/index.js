const { notify } = require('../notifier');
const { loadItemsToScrape, getUsersToNotify } = require('../database');
const { evaluate } = require('../scraper');

class Scheduler {
  constructor(periodMs) {
    this.period = periodMs;
    this.run = this.run.bind(this);
  }

  async run() {
    const now = Date.now();
    console.log(`Beginning run: ${new Date(now).toISOString()}`);
    const items = await loadItemsToScrape();
    console.log(items);

    const users = await getUsersToNotify();
    //console.log(users);

    const changes = [];
    for (let i = 0; i < items.length; i++) {
      const change = await evaluate(items[i]);
      if (change) {
        changes.push(change);
      }
    }

    //notify(changes);
  }

  start() {
    //this.interval = setInterval(this.run, this.periodMs);
    this.run();
  }

  stop() {
    //clearInterval(this.interval);
  }
}

module.exports = Scheduler;
