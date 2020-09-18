const Scheduler = require('../../src/scheduler');

describe('Scheduler', function () {
  // TODO: simple static express server for dummy pages/pdfs
  describe('#evaluate', function () {
    const scheduler = new Scheduler();

    it.skip('should compare a new page', async function () {
      this.timeout(10000);
      const item = {
        type: 'html',
        state: 'AL',
        category: 'General Election',
        url: 'https://www.sos.alabama.gov/alabama-votes/voter/register-to-vote',
        hash: '',
        pdfs: [{ url: '', hash: '' }],
        content: '',
        disableScrape: false,
        lastChangeDate: undefined,
      };
      const change = await scheduler.evaluate(item);
      console.log(change);
    });

    it('should see that a page is unchaged');

    it('should find diffs on an existing page');

    it("should report an error if it can't fetch the html");

    it("shouldn't fail, but report a change if it can't fetch a PDF");
  });
});
