const axios = require('axios');
const { TaskQueue } = require('cwait');
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

// set the max number of concurrent HTML and PDF downloads
const MAX_SIMULTANEOUS_DOWNLOADS = 20;

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
  //const items = await loadItemsToScrape({ state: {'$in':['CA', 'NY']} });

  const totalItems = items.length;
  console.log(`Found ${totalItems} urls to check for changes.`);

  // download the site content first
  let itemsAndContent = await getSiteContent(items);

  const changes = [];
  for (let i = 0; i < itemsAndContent.length; i++) {
    const item = itemsAndContent[i].item;
    const content = itemsAndContent[i].content;
    const itemId = item._id;
    const itemUrl = item.url;
    const itemState = item.state;
    const itemCategory = item.category;
    console.log(`Checking url ${i + 1} of ${totalItems}: ${itemUrl} (${itemState}-${itemCategory}) ...`);
    // create scrape attempt
    const scrapeAttempt = await createScrapeAttempt(itemId, Date.now(), currentScrapeJob._id, 'Incomplete scrape');

    const change = await evaluate(item, content);

    // update scrape attempt
    const updatedScrapeAttempt = updateScrapeAttempt(scrapeAttempt._id, Date.now());
    //console.log('updated scrape attempt', updatedScrapeAttempt);
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
      const updatedScrapeItem = updateScrapeItem(item._id, updateObj);
      //console.log('updated scrape item', updatedScrapeItem);
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

async function getSiteContent(items) {
  const queue = new TaskQueue(Promise, MAX_SIMULTANEOUS_DOWNLOADS);
  const results = await Promise.all(
    items.map(
      queue.wrap(async (item) => {
        if (item.type == 'html') {
          console.log(`Downloading html data from ${item.url} ...`);
          const { data: content } = await axios
            .get(item.url, {
              validateStatus: function (status) {
                //console.log('Url status response:', status);
                return status < 500; // Resolve only if the status code is less than 500
              },
            })
            .catch(function (error) {
              console.log(error.message);
              return { data: null };
            });
          return { item, content };
        } else if (item.type == 'pdf') {
          console.log(`Downloading pdf data from ${item.url} ...`);
          const content = await axios.get(item.url, { responseType: 'arraybuffer' }).catch(function (error) {
            console.log(error.message);
            return null;
          });
          return { item, content };
        }
      }),
    ),
  );
  return results;
}

async function getPDFHashes(pdfUrls) {
  const queue = new TaskQueue(Promise, MAX_SIMULTANEOUS_DOWNLOADS);
  const results = await Promise.all(
    pdfUrls.map(
      queue.wrap(async (url) => {
        console.log(`Downloading pdf data from ${url} ...`);
        let errorMessage = '';
        const content = await axios.get(url, { responseType: 'arraybuffer' }).catch(function (error) {
          console.log(error.message);
          errorMessage = error.message;
          return null;
        });
        console.log(`Hashing pdf from ${url} ...`);
        if (content) {
          const dataObj = await hashPdf(content.data);
          return { url: url, hash: dataObj.hash, error: dataObj.error };
        } else {
          return { url: url, hash: null, error: { type: 'axios', message: errorMessage } };
        }
      }),
    ),
  );
  return results;
}

//
async function evaluate(item, content) {
  try {
    // need to process html items different than pdf items
    let foundChange = false;
    let change = { item, changedPdfs: [] };
    if (item.type == 'html') {
      if (!content) {
        return null;
      }

      // compare current html with previous html
      console.log(`Comparing previous html from ${item.url}`);
      let { diffs, pdfs: pdfUrls } = compareVersions(item.url, content, item.content);
      change.current = content;
      change.diffs = diffs || [];
      foundChange = diffs.length > 0;

      // dedup urls
      pdfUrls = dedup(pdfUrls);
      console.log(`Found ${pdfUrls.length} pdfs`);

      // get pdf data from previous job
      const oldPdfs = item.pdfs.sort(stableUrlSort) || [];
      foundChange = foundChange || pdfUrls.length !== oldPdfs.length;

      // get hashes for all pdf data
      const pdfs = await getPDFHashes(pdfUrls);

      // determine if pdfs have changed
      for (let i = 0; i < pdfs.length; i++) {
        console.log(`Checking pdf ${i + 1} of ${pdfs.length} ...`);
        const pdfUrl = pdfs[i].url;
        const pdfHash = pdfs[i].hash;
        const pdfError = pdfs[i].error;
        const matchingPdf = oldPdfs.find(({ url }) => url === pdfUrl);
        if (!matchingPdf) {
          if (!pdfError) {
            console.log(`New pdf: ${pdfUrl}`);
            // this is a newly added pdf
            change.changedPdfs.push({ added: true, pdf: pdfs[i] });
          } else if (pdfError.type == 'axios') {
            console.log(`Missing pdf: ${pdfUrl}`);
            change.changedPdfs.push({ removed: true, pdf: pdfs[i] });
          } else if (pdfError.type == 'pdf-parse') {
            console.log(`Invalid pdf: ${pdfUrl}`);
            change.changedPdfs.push({ invalid: true, pdf: pdfs[i] });
          }
          foundChange = true;
        } else {
          if (pdfHash !== matchingPdf.hash) {
            console.log(`Updated pdf: ${pdfUrl}`);
            // this pdf changed
            change.changedPdfs.push({ modified: true, pdf: pdfs[i] });
            foundChange = true;
          } else {
            console.log(`Unchanged pdf: ${pdfUrl}`);
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
        } else {
          console.log(`Unchanged pdf: ${pdf.url}`);
        }
      }
    } else if (item.type == 'pdf') {
      const pdf = await hashPdf(content.data);
      if (!pdf.error) {
        if (item.hash) {
          if (pdf.hash !== item.hash) {
            console.log(`Updated pdf: ${item.url}`);
            // this pdf changed
            change.changedPdfs.push({ modified: true, pdf });
            foundChange = true;
          } else {
            console.log(`Unchanged pdf: ${item.url}`);
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
    console.error(`Failed querying ${item.url}`, e.message);
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
  getSiteContent,
  getPDFHashes,
  evaluate,
};
