const diff = require('diff');

/**
 * Create a list of diffs that occurred in a section of text
 * @param {string} oldText the old version of the text
 * @param {string} newText the new version of the text
 */
function diffText(oldText, newText) {
  const oldCleaned = cleanText(oldText);
  const newCleaned = cleanText(newText);

  const chunks = diff.diffSentences(oldCleaned, newCleaned);
  // console.log(chunks);

  let lastChunk = { value: '' };
  const diffs = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const diff = { pre: '', prior: '', current: '', post: '' };
    if (chunk.removed) {
      const removed = chunk.value.trim();
      const preContent = context(lastChunk, true).trim();
      const nextChunk = chunks[i + 1] || { value: '' };
      const postContent = nextChunk.added ? context(chunks[i + 2], false) : context(nextChunk, false).trim();
      const added = nextChunk.added ? nextChunk.value : '';
      diff.pre = preContent;
      diff.current = `${added}`.trim();
      diff.prior = `${removed}`.trim();
      diff.post = postContent;
      diffs.push(diff);
      if (nextChunk.added) {
        i += 1;
      }
    } else if (chunk.added) {
      diff.pre = context(lastChunk, true).trim();
      diff.post = context(chunks[i + 1], false).trim();
      diff.prior = ''; // this is an add not preceeded by a remove
      diff.current = chunk.value.trim();
      diffs.push(diff);
    }
    lastChunk = chunk;
  }
  return diffs;
}

function context(chunk = { value: '' }, pre) {
  const sentences = chunk.value.trim().split('.');
  const value = (pre ? sentences[sentences.length - 2] : sentences[0]) || '';
  return `${value}${value && '.'}`;
}

function cleanText(text = '') {
  let cleaned = text
    .replace(/\./g, '. ') // ensure punctuation is followed by a space
    .replace(/\!/g, '! ')
    .replace(/\?/g, '? ')
    .replace(/ +/g, ' ') // collapse runs of whitespace
    .replace(/\s*\n+/g, '\n')
    .trim(); // trim trailing whitespace

  const links = cleaned.match(/\[http.+?\]/g);
  if (links) {
    for (let i = 0; i < links.length; i++) {
      const fixed = links[i].replace(/ /g, '');
      cleaned = cleaned.replace(links[i], fixed);
    }
  }

  return cleaned;
}

module.exports = {
  diffText,
  cleanText,
};
