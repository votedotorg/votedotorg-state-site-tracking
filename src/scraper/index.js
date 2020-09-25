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
    console.log(`Last successful job completed on ${new Date(lastScrapeJob.endDate).toString()}`);
  } else {
    console.log('No previous successful jobs');
  }

  // record the start of the current scrape job
  console.log('Starting new job ...');
  const scrapeJobsStartDate = Date.now();
  let currentScrapeJob = await createScrapeJob(scrapeJobsStartDate);

  // get all scrape items from the database
  console.log('Loading urls from database ...');
  const items = await loadItemsToScrape({});
  // DEBUG: find some state specific scrape items for testing
  // TODO: Figure out why no change for first run of DC-AbsenteeInfo https://www.vote4dc.com/ApplyInstructions/Absentee
  //const items = await loadItemsToScrape({ state: {'$in':['DC']} });
  //console.log('items to scrape', items);

  const totalItems = items.length;
  console.log(`Found ${totalItems} urls to check for changes.`);

  const changes = [];
  for (let i = 0; i < totalItems; i++) {
    const itemUrl = items[i].url;
    const itemState = items[i].state;
    const itemCategory = items[i].category;
    console.log(`Checking url ${i + 1} of ${totalItems}: ${itemUrl} (${itemState}-${itemCategory}) ...`);
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
      console.log(`Found changes at ${itemUrl}`);
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
      console.log(`No changes at ${itemUrl}`);
    }
  }
  if (lastScrapeJob) {
    console.log(
      `Total of ${changes.length} urls changed since last job on ${new Date(lastScrapeJob.endDate).toString()}`,
    );
  } else {
    console.log(`Total of ${changes.length} urls changed`);
  }

  // update scrape job to indicate it completed
  const scrapeJobsEndDate = Date.now();
  const updatedScrapeJob = await updateScrapeJob(currentScrapeJob._id, scrapeJobsEndDate);

  // calculate time to complete job
  const scrapeJobTimeSec = parseInt((scrapeJobsEndDate - scrapeJobsStartDate) / 1000);
  const scrapeJobTimeMin = parseInt(scrapeJobTimeSec / 60);
  console.log(
    `Completed job in ${scrapeJobTimeMin} min ${scrapeJobTimeSec % 60} sec on ${new Date(
      scrapeJobsEndDate,
    ).toString()}`,
  );

  return { changes, lastScrapeJob };
}

//
async function evaluate(item) {
  try {
    //console.log('Comparing url: ', item.url);
    // need to process html items different than pdf items
    let foundChange = false;
    let change = { item, changedPdfs: [] };
    if (item.type == 'html') {
      const { data: current } = await axios.get(item.url, {
        validateStatus: function (status) {
          console.log('Url status response:', status);
          return status < 500; // Resolve only if the status code is less than 500
        },
      });
      if (!current) {
        return null;
      }
      change.current = current;
      let { diffs, pdfs: pdfUrls } = compareVersions(item.url, current, item.content);
      change.diffs = diffs || [];
      foundChange = diffs.length > 0;

      // dedup urls
      pdfUrls = dedup(pdfUrls);
      console.log(`Found ${pdfUrls.length} pdfs`);

      const oldPdfs = item.pdfs.sort(stableUrlSort) || [];
      foundChange = foundChange || pdfUrls.length !== oldPdfs.length;

      for (let i = 0; i < pdfUrls.length; i++) {
        console.log(`Checking pdf ${i + 1} of ${pdfUrls.length} ...`);
        const pdf = await hashPdf(pdfUrls[i]);
        //console.log('PDF hash: ', pdf.hash);
        const matchingPdf = oldPdfs.find(({ url }) => url === pdf.url);
        if (!matchingPdf) {
          if (!pdf.error) {
            console.log(`New pdf: ${pdfUrls[i]}`);
            // this is a newly added pdf
            change.changedPdfs.push({ added: true, pdf });
          } else if (pdf.error.type == 'axios') {
            console.log(`Missing pdf: ${pdfUrls[i]}`);
            change.changedPdfs.push({ removed: true, pdf });
          } else if (pdf.error.type == 'pdf-parse') {
            console.log(`Invalid pdf: ${pdfUrls[i]}`);
            change.changedPdfs.push({ invalid: true, pdf });
          }
          foundChange = true;
        } else {
          if (pdf.hash !== matchingPdf.hash) {
            console.log(`Updated pdf: ${pdfUrls[i]}`);
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
          console.log(`Missing pdf: ${pdf.url}`);
          // this pdf was removed
          change.changedPdfs.push({ removed: true, pdf });
          foundChange = true;
        }
      }
    } else if (item.type == 'pdf') {
      const pdf = await hashPdf(item.url);
      if (!pdf.error) {
        if (item.hash) {
          if (pdf.hash !== item.hash) {
            console.log(`Updated pdf: ${item.url}`);
            // this pdf changed
            change.changedPdfs.push({ modified: true, pdf });
            foundChange = true;
          }
        } else {
          console.log(`New pdf: ${item.url}`);
          // this pdf changed
          change.changedPdfs.push({ added: true, pdf });
          foundChange = true;
        }
      } else if (pdf.error.type == 'axios') {
        console.log(`Missing pdf: ${item.url}`);
        change.changedPdfs.push({ removed: true, pdf });
        foundChange = true;
      } else if (pdf.error.type == 'pdf-parse') {
        console.log(`Invalid pdf: ${item.url}`);
        change.changedPdfs.push({ invalid: true, pdf });
        foundChange = true;
      }
    }
    return foundChange ? change : null;
  } catch (e) {
    // report the error
    console.error(`Failed querying ${item.url}`);
  }
}

async function resetScrapeItems() {
  return await updateAllScrapeItems({
    hash: null,
    pdfs: [],
    content: null,
    lastChangeDate: null,
    lastChangeJobId: null,
  });
}

module.exports = {
  startJob,
  resetScrapeItems,
};
