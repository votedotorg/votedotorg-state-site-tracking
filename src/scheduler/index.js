const axios = require('axios');

const { notify } = require('../notifier');
const { loadItemsToScrape } = require('../database');
const { compareVersions } = require('../scraper/html');
const { hashPdf } = require('../scraper/pdf');

const stableUrlSort = (l, r) => (l.url < r.url ? -1 : 1);

class Scheduler {
  constructor(periodMs) {
    this.period = periodMs;
    this.run = this.run.bind(this);
  }

  async run() {
    const now = Date.now();
    console.log(`Beginning run: ${new Date(now).toISOString()}`);
    const items = await loadItemsToScrape();

    const changes = [];
    for (let i = 0; i < items.length; i++) {
      const change = await this.evaluate(items[i]);
      if (change) {
        changes.push(change);
      }
    }

    notify(changes);
  }

  async evaluate(item) {
    try {
      const { data: current } = await axios.get(item.url);
      const { diffs, pdfs: pdfUrls } = compareVersions(item.url, current, item.content);

      let foundChange = diffs.length > 0;
      const change = { item, diffs, changedPdfs: [] };
      const oldPdfs = item.pdfs.sort(stableUrlSort);
      foundChange = foundChange || newPdfs.length !== oldPdfs.length;
      for (let i = 0; i < pdfUrls.length; i++) {
        const pdf = await hashPdf(pdfUrls[i]);
        const matchingPdf = oldPdfs.find(({ url }) => url === pdf.url);
        if (!matchingPdf) {
          // this is a newly added pdf
          change.changedPdfs.push({ added: true, pdf });
          foundChange = true;
        } else {
          const pdf = await hashPdf(url);
          if (pdf.hash !== matchingPdf.hash) {
            // this pdf changed
            change.changedPdfs.push({ modified: true, pdf });
            foundChange = true;
          }
        }
      }
      for (let i = 0; i < oldPdfs.length; i++) {
        const pdf = oldPdfs[i];
        const matchingPdf = pdfUrls.find((url) => url === pdf.url);
        if (!matchingPdf) {
          // this pdf was removed
          change.changedPdfs.push({ removed: true, pdf });
          foundChange = true;
        }
      }
      return foundChange ? change : null;
    } catch (e) {
      // report the error
      console.error(`Failed querying ${item.url}`, e);
    }
  }

  start() {
    this.interval = setInterval(this.run, this.periodMs);
    this.run();
  }

  stop() {
    clearInterval(this.interval);
  }
}

module.exports = Scheduler;
