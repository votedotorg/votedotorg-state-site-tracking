const axios = require('axios');
const { compareVersions } = require('./html');
const { hashPdf } = require('./pdf');
const { dedup } = require('../util/array');

const stableUrlSort = (l, r) => (l.url < r.url ? -1 : 1);
//
async function evaluate(item) {
  try {
    console.log('Comparing url: ', item.url);
    /*axios.get(item.url).then(function ({ data: current }) {

    }).catch(function(error) {
      console.log('axios error: ', error.message);
      return { url, hash: '', error: error.message };
    });*/
    const { data: current } = await axios.get(item.url);
    let { diffs, pdfs: pdfUrls } = compareVersions(item.url, current, item.content);

    let foundChange = diffs.length > 0;
    if (foundChange) {
      console.log('Found changes in html ...');
    } else {
      console.log('No change in html ...');
    }
    // dedup urls
    pdfUrls = dedup(pdfUrls);
    console.log('PDF URLs: ', pdfUrls);

    let change = { item, diffs, changedPdfs: [] };
    const oldPdfs = item.pdfs.sort(stableUrlSort) || [];
    foundChange = foundChange || pdfUrls.length !== oldPdfs.length;
    for (let i = 0; i < pdfUrls.length; i++) {
      const pdf = await hashPdf(pdfUrls[i]);
      //console.log('PDF hash: ', pdf.hash);
      const matchingPdf = oldPdfs.find(({ url }) => url === pdf.url);
      if (!matchingPdf) {
        // this is a newly added pdf
        change.changedPdfs.push({ added: true, pdf });
        foundChange = true;
      } else {
        console.log('PDF url: ', url);
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

module.exports = {
  evaluate,
};
