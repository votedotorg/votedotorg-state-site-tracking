const nodemailer = require('nodemailer');

const { getUsersToNotify } = require('../database');

const { SENDGRID_USERNAME: user, SENDGRID_PASSWORD: pass } =
  process.env.NODE_ENV === 'production' ? process.env : require('./config');

const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: { user, pass },
});

// returns the email promise
// TODO: should this function retry?
async function notify(changes) {
  let from = ''; // TODO: who?
  let to = (await getUsersToNotify()).map((u) => u.email);
  let subject = `Updates for ${date}`;
  let body = generateEmailBody(changedURLs);
  return sendEmail(from, to, subject, body);
}

function generateEmailBody(changedURLs) {
  let body = '<h3>Changed Pages</h3>';
  body += '<table><tr><th>Link</th></tr>';
  for (let i = 0; i < changedURLs.length; i++) {
    body += `<tr><td>${changedURLs[i]}</td></tr>`;
  }
  body += '</table>';
  return body;
}

function sendEmail(from, to, subject, body) {
  return transporter.sendMail({ from, to, subject, html: body });
}

module.exports = {
  notify,
  generateEmailBody,
  sendEmail,
};
