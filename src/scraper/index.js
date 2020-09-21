const axios = require('axios');
const { compareVersions } = require('./html');
const { hashPdf } = require('./pdf');
const { dedup } = require('../util/array');

const stableUrlSort = (l, r) => (l.url < r.url ? -1 : 1);
//
async function evaluate(item) {
  try {
    console.log('Comparing url: ', item.url);
    //console.log('item.content', item.content);
    // if there is no previous content to compare to do nothing
    //if (item.content) {
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
    console.log(`Found ${pdfUrls.length} PDF URLs`);

    let change = { item, diffs, changedPdfs: [] };
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
    //} else {
    // no need to compare
    //return null;
    //}
  } catch (e) {
    // report the error
    console.error(`Failed querying ${item.url}`, e);
  }
}

module.exports = {
  evaluate,
};
