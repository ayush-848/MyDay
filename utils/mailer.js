const nodemailer = require('nodemailer');
const newsletterTemplate = require('../templates/newsLetterTemplate');
require('dotenv').config();
const crypto = require('crypto');
const Subscriber = require('../server/models/Subscriber');

// Configure Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate a unique unsubscribe token
const generateUnsubscribeToken = (email) => {
  return crypto.createHash('sha256').update(email + process.env.SECRET_KEY).digest('hex');
};

// Send newsletter email
const sendNewsletter = async (to, subject, content) => {
  // Generate an unsubscribe token for the subscriber
  const unsubscribeToken = generateUnsubscribeToken(to);

  // Save or update the unsubscribe token in the database
  await Subscriber.updateOne({ email: to }, { unsubscribeToken: unsubscribeToken }, { upsert: true });

  // Define mail options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: newsletterTemplate(content, unsubscribeToken)
  };

  // Send the email
  return transporter.sendMail(mailOptions);
};

module.exports = { sendNewsletter };
