class HtmlScraper {
    scrape(currentHtml, previousHtml) {
        const diffs = [];
        const pdfs = this.findLinksToPdfs(currentHtml)
        return { diffs, pdfs };
    }

    extractText(html) {
        return '';
    }

    findLinksToPdfs(html) {
        return [];
    }
}

module.exports = HtmlScraper;