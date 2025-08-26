const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Contact page
router.get('/', (req, res) => {
  res.render('contact', {
    title: 'Contact Us - Gelelcha Charity',
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
});

// Contact form submission
router.post('/', [
  check('name', 'Name is required').notEmpty().trim(),
  check('email', 'Please include a valid email').isEmail(),
  check('subject', 'Subject is required').notEmpty().trim(),
  check('message', 'Message is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    req.flash('error_msg', 'Please fill in all required fields correctly');
    return res.redirect('/contact');
  }

  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Save to database
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });
    
    await contact.save();
    
    // Send email notification (optional)
    try {
      // Check if email credentials are configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        
        const mailOptions = {
          from: email,
          to: process.env.ADMIN_EMAIL || 'admin@gelelcha.org',
          subject: `New Contact Message: ${subject}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Contact form email sent successfully');
      }
    } catch (emailError) {
      console.log('Email sending failed (this is optional):', emailError.message);
    }
    
    req.flash('success_msg', 'Your message has been sent successfully! We will get back to you soon.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error_msg', 'There was an error sending your message. Please try again.');
    res.redirect('/contact');
  }
});

module.exports = router;