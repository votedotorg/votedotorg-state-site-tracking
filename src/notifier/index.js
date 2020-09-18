const nodemailer = require('nodemailer');
let auth;

if (process.env.NODE_ENV === 'production') {
  auth = process.env;
} else {
  auth = require('./config.json');
}

const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: auth.SENDGRID_USERNAME,
    pass: auth.SENDGRID_PASSWORD,
  },
});

class Notifier {
  /*notify(listOfChanges) {
        for(let i = 0; i < listOfChanges.length; i++) {
            const { url, changes } = listOfChanges[i];
        }
        // render email template
        // fetch users to email from db
        // send emails                
    }*/

  notify(from, recipients, date, changedURLs, callback) {
    let from = from; //String in test@test.com format or 'Name <test@test.com>' format
    let to = recipients; //String or Array of Strings
    let subject = `Updates for ${date}`; //Placeholder subject
    let body = this.generateEmailBody(changedURLs);
    this.sendEmail(from, to, subject, body, callback);
  }

  generateEmailBody(changedURLs) {
    let body = '<h3>Changed Pages</h3>';
    body += '<table><tr><th>Link</th></tr>';
    for (let i = 0; i < changedURLs.length; i++) {
      body += `<tr><td>${changedURLs[i]}</td></tr>`;
    }
    body += '</table>';
    return body;
  }

  sendEmail(from, to, subject, body, callback) {
    transporter.sendMail(
      {
        from: from,
        to: to,
        subject: subject,
        html: body,
      },
      callback,
    );
  }
}

module.exports = Notifier;
