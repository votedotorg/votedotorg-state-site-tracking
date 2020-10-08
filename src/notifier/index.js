require('dotenv').config();

const nodemailer = require('nodemailer');
const { getUsersToNotify } = require('../database');

let user = '';
let pass = '';
if (process.env.NODE_ENV === 'production') {
  user = process.env.SENDGRID_USERNAME;
  pass = process.env.SENDGRID_PASSWORD;
}

async function notify(changes, lastScrapeJob, useTestAccount) {
  if (changes && changes.length > 0) {
    // Create a SMTP transporter object
    let obj = {
      service: 'SendGrid',
      auth: { user, pass },
    };

    // if testing then create test account
    if (useTestAccount) {
      let account = await nodemailer.createTestAccount();
      console.log('Credentials obtained, sending notification email ...');
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
      console.log('Sending notification email ...');
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
    if (useTestAccount) {
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
  let body = '<h2>State Website Changes</h2>';
  body += '<div class="container message-container">';
  let detail = '';
  let totalPdfsChanged = 0;
  for (let i = 0; i < changes.length; i++) {
    const item = changes[i].item;
    const itemHtmlChanged = changes[i].diffs && changes[i].diffs.length > 0;
    const itemState = item.state;
    const itemCategory = item.category;
    const itemUrl = item.url;
    const numChangedPdfs = changes[i].changedPdfs.length;
    detail += `<div>&nbsp;</div>`;
    detail += `<div class="state-change-header" style="margin-bottom: 5px">${i + 1}) HTML did ${
      itemHtmlChanged ? '' : 'not'
    } change for state <strong>${itemState} - ${itemCategory}:</strong> <a href='${itemUrl}'>${itemUrl}</a></div>`;
    if (numChangedPdfs > 0) {
      totalPdfsChanged += numChangedPdfs;
      detail += `<div class="pdf-change-header" style="margin-left: 12px; margin-bottom: 5px"><strong>${numChangedPdfs}</strong> PDF files changed:</div>`;
      detail += `<div class="pdf-change-list" style="margin-left: 20px">`;
      for (let n = 0; n < numChangedPdfs; n++) {
        const changedPdf = changes[i].changedPdfs[n];
        let typeOfChange;
        if (changedPdf.added) {
          typeOfChange = 'Added';
        } else if (changedPdf.modified) {
          typeOfChange = 'Updated';
        } else if (changedPdf.invalid) {
          typeOfChange = 'Invalid';
        } else if (changedPdf.removed || changedPdf.pdf.error) {
          typeOfChange = 'Missing';
        }
        const pdfUrl = changedPdf.pdf.url;
        detail += `<li>${typeOfChange}: <a href='${pdfUrl}'>${pdfUrl}</a></li>`;
      }
      detail += `</div>`;
    } else {
      detail += `<div class="pdf-change-header" style="margin-left: 12px; margin-bottom: 5px">No PDF files changed</div>`;
    }
  }
  let summary = `<div class="row change-summary">There were <strong>${changes.length}</strong> state website changes and <strong>${totalPdfsChanged}</strong> total PDF changes`;
  if (lastScrapeJob) {
    summary += ` since last checked on <strong>${new Date(lastScrapeJob.endDate).toString()}</strong>`;
  }
  summary += `</div>`;
  body = body + summary + detail;
  body += '</div>';

  return body;
}

module.exports = {
  notify,
};
