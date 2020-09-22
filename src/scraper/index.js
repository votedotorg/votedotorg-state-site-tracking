const axios = require('axios');
const { compareVersions } = require('./html');
const { hashPdf } = require('./pdf');
const { dedup } = require('../util/array');
const {
  clearScrapeJobs,
  getScrapeJobs,
  getLatestScrapeJob,
  loadItemsToScrape,
  createScrapeJob,
  updateScrapeJob,
  createScrapeAttempt,
  updateScrapeAttempt,
  getLatestScrapeAttempt,
  updateScrapeItem,
  updateAllScrapeItems,
} = require('../database');

const stableUrlSort = (l, r) => (l.url < r.url ? -1 : 1);

//
async function startJob() {
  // DEBUG: uncomment next line to clear all scrape jobs
  //const result = await clearScrapeJobs();

  // DEBUG: view the scrape jobs
  //const scrapeJobs = await getScrapeJobs();
  //console.log('Scrape jobs: ', scrapeJobs);

  // get the last successful scrape job
  const lastScrapeJob = await getLatestScrapeJob();
  if (lastScrapeJob) {
    console.log(
      `\n********** Last successful scrape job: ${new Date(lastScrapeJob.startDate).toISOString()} **********\n`,
    );
  } else {
    console.log(`\n********** No successful scrape jobs **********\n`);
  }

  // record the start of the current scrape job
  const scrapeJobsStartDate = Date.now();
  console.log(`\n********** Starting new scrape job: ${new Date(scrapeJobsStartDate).toISOString()} **********\n`);
  let currentScrapeJob = await createScrapeJob(scrapeJobsStartDate);

  // get scrape items from the database
  console.log('\n********** Loading scrape items from database **********\n');
  const items = await loadItemsToScrape({});

  // DEBUG: find one item to scrape for testing
  //const items = await loadItemsToScrape({ state: 'CA' });
  //console.log('items to scrape', items);

  const totalItems = items.length;
  console.log(`\n********** Loaded ${totalItems} scrape items **********\n`);

  const changes = [];
  for (let i = 0; i < totalItems; i++) {
    console.log(`\n********** Evaluating scrape item ${i + 1} of ${totalItems} **********\n`);
    // create scrape attempt
    const scrapeAttempt = await createScrapeAttempt(
      items[i]._id,
      Date.now(),
      currentScrapeJob._id,
      'Incomplete scrape',
    );

    const change = await evaluate(items[i]);
    //console.log('change', change);
    // update scrape attempt
    const updatedScrapeAttempt = await updateScrapeAttempt(scrapeAttempt._id, Date.now());
    //console.log('updated scrapeAttempt', updatedScrapeAttempt);
    if (change) {
      console.log(`\n********** Scrape item ${i + 1} changed **********\n`);
      changes.push(change);
      // update scrape item
      let updateObj = {
        lastChangeDate: Date.now(),
        lastChangeJobId: currentScrapeJob._id,
      };
      if (change.item.type == 'html') {
        updateObj.content = change.current;
        const totalChangedPdfs = change.changedPdfs.length;
        if (totalChangedPdfs > 0) {
          updateObj.pdfs = [];
        }
        for (let i = 0; i < totalChangedPdfs; i++) {
          const changedPdf = change.changedPdfs[i].pdf;
          updateObj.pdfs.push({ url: changedPdf.url, hash: changedPdf.hash });
        }
      } else if (change.item.type == 'pdf' && change.changedPdfs.length == 1) {
        updateObj.hash = change.changedPdfs[0].pdf.hash;
      }
      const updatedScrapeItem = await updateScrapeItem(items[i]._id, updateObj);
      //console.log('updated scrapeAttempt', updatedScrapeAttempt);
    } else {
      console.log(`\n********** No changes for scrape item ${i + 1} **********\n`);
    }
  }
  console.log(`\n********** ${changes.length} scrape items changed **********\n`);

  // update scrape job to indicate it completed
  const scrapeJobsEndDate = Date.now();
  const updatedScrapeJob = await updateScrapeJob(currentScrapeJob._id, scrapeJobsEndDate);

  console.log(`\n********** Completed scrape job at ${new Date(scrapeJobsEndDate).toISOString()} **********\n`);
  const scrapeJobTimeSec = parseInt((scrapeJobsEndDate - scrapeJobsStartDate) / 1000);
  //console.log('scrapeJobTimeSec', scrapeJobTimeSec);
  const scrapeJobTimeMin = parseInt(scrapeJobTimeSec / 60);
  console.log(`Scrape job compeleted in ${scrapeJobTimeMin} min ${scrapeJobTimeSec % 60} sec`);

  return changes;
}

//
async function evaluate(item) {
  try {
    console.log('Comparing url: ', item.url);
    // need to process html items different than pdf items
    let foundChange = false;
    let change = { item, changedPdfs: [] };
    if (item.type == 'html') {
      const { data: current } = await axios.get(item.url);
      change.current = current;
      let { diffs, pdfs: pdfUrls } = compareVersions(item.url, current, item.content);
      change.diffs = diffs;

      foundChange = diffs.length > 0;
      if (foundChange) {
        console.log('Found changes in html ...');
      } else {
        console.log('No change in html ...');
      }
      // dedup urls
      pdfUrls = dedup(pdfUrls);
      console.log(`Found ${pdfUrls.length} PDF URLs`);

      const oldPdfs = item.pdfs.sort(stableUrlSort) || [];
      foundChange = foundChange || pdfUrls.length !== oldPdfs.length;

      for (let i = 0; i < pdfUrls.length; i++) {
        console.log(`Hashing PDF URL ${i + 1} of ${pdfUrls.length}: ${pdfUrls[i]}`);
        const pdf = await hashPdf(pdfUrls[i]);
        if (pdf.error) {
          console.log(pdf.error);
        } else {
          console.log('PDF hash created');
        }
        //console.log('PDF hash: ', pdf.hash);
        const matchingPdf = oldPdfs.find(({ url }) => url === pdf.url);
        if (!matchingPdf) {
          // this is a newly added pdf
          change.changedPdfs.push({ added: true, pdf });
          foundChange = true;
        } else {
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
    } else if (item.type == 'pdf') {
      const pdf = await hashPdf(item.url);
      if (pdf.hash !== item.hash) {
        // this pdf changed
        change.changedPdfs.push({ modified: true, pdf });
        foundChange = true;
      }
    }
    return foundChange ? change : null;
  } catch (e) {
    // report the error
    console.error(`Failed querying ${item.url}`, e);
  }
}

module.exports = {
  startJob,
  evaluate,
};
