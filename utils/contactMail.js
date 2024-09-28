const nodemailer = require('nodemailer');
const contactFormTemplate = require('../templates/contactFormTemplate');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Your email
        pass: process.env.EMAIL_PASS,     // App password for Nodemailer
    }
});

// Function to send the contact form email
const sendContactFormEmail = (name, email, message) => {
    const mailOptions = {
        from: email,  // Sender's email
        to: process.env.EMAIL_USER,  // Your receiving email
        subject: `New Contact Form Submission from ${name}`,
        html: contactFormTemplate(name, email, message)  // Use template
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = sendContactFormEmail;
