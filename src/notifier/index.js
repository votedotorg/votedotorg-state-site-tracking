const nodemailer = require('nodemailer');
const { getUsersToNotify } = require('../database');

const { SENDGRID_USERNAME: user, SENDGRID_PASSWORD: pass } =
  process.env.NODE_ENV === 'production' ? process.env : require('./config');

async function notify(changes, lastScrapeJob, test) {
  if (changes && changes.length > 0) {
    // Create a SMTP transporter object
    let obj = {
      service: 'SendGrid',
      auth: { user, pass },
    };

    // if testing then create test account
    if (test) {
      let account = await nodemailer.createTestAccount();
      console.log('Credentials obtained, sending notification email...');
      obj = {
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      };
    } else {
      console.log('Sending notification email...');
    }

    let transporter = nodemailer.createTransport(obj);

    // Message object
    let message = {
      from: 'Vote.org <no-reply@vote.org>',
      to: (await getUsersToNotify()).map((u) => u.email),
      subject: `Notification of state website changes for ${new Date(Date.now()).toDateString()}`,
      html: generateEmailBody(changes, lastScrapeJob),
    };

    let info = await transporter.sendMail(message);

    console.log('Notification email sent successfully!');
    if (test) {
      console.log('Test notification email url:', nodemailer.getTestMessageUrl(info));
    }
    // only needed when using pooled connections
    transporter.close();
  } else {
    console.log('No changes so no need to send notification email');
  }
}

// creates a HTML format of the site changes
function generateEmailBody(changes, lastScrapeJob) {
  let body = '<h2>Changed State Websites</h2>';
  body += '<table>';
  body += `<tr><td>There were <strong>${changes.length}</strong> state website changes`;
  if (lastScrapeJob) {
    body += ` since last checked on <strong>${new Date(lastScrapeJob.endDate).toString()}</strong>`;
  }
  body += `</td></tr><tr><td>&nbsp;</td></tr>`;
  for (let i = 0; i < changes.length; i++) {
    const item = changes[i].item;
    const itemHtmlChanged = changes[i].diffs.length > 0;
    const itemState = item.state;
    const itemCategory = item.category;
    const itemUrl = item.url;
    const numChangedPdfs = changes[i].changedPdfs.length;
    body += `<tr><td>HTML did ${
      itemHtmlChanged ? '' : 'not'
    } change for state <strong>${itemState} - ${itemCategory}:</strong> <a href='${itemUrl}'>${itemUrl}</a></td></tr>`;
    body += `<tr><td>&nbsp;</td></tr>`;
    if (numChangedPdfs > 0) {
      body += `<tr><th align=left>${numChangedPdfs} PDF files changed:</th></tr>`;
      body += `<tr><td>`;
      for (let n = 0; n < numChangedPdfs; n++) {
        const changedPdf = changes[i].changedPdfs[n];
        let typeOfChange;
        if (changedPdf.added) {
          typeOfChange = 'Added';
        } else if (changedPdf.modified) {
          typeOfChange = 'Modified';
        } else if (changedPdf.removed || changedPdf.pdf.error) {
          typeOfChange = 'Removed';
        }
        const pdfUrl = changedPdf.pdf.url;
        body += `<li>${typeOfChange}: <a href='${pdfUrl}'>${pdfUrl}</a></li>`;
      }
      body += `</td></tr><tr><td>&nbsp;</td></tr>`;
    }
  }
  body += '</table>';
  return body;
}

module.exports = {
  notify,
};
