const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Volunteer = require('../models/Volunteer');

// Volunteer page
router.get('/', (req, res) => {
  res.render('volunteer', {
    title: 'Volunteer - Gelelcha Charity',
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
});

// Volunteer form submission
router.post('/', [
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('phone', 'Phone number is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    req.flash('error_msg', 'Please fill in all required fields correctly');
    return res.redirect('/volunteer');
  }

  try {
    const volunteer = new Volunteer({
      personalInfo: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        address: {
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode,
          country: req.body.country
        }
      },
      skills: req.body.skills ? req.body.skills.split(',').map(skill => skill.trim()) : [],
      interests: req.body.interests ? req.body.interests.split(',').map(interest => interest.trim()) : [],
      availability: req.body.availability
    });

    await volunteer.save();
    
    req.flash('success_msg', 'Thank you for your interest in volunteering! We will contact you soon.');
    res.redirect('/volunteer');
  } catch (error) {
    console.error('Volunteer registration error:', error);
    req.flash('error_msg', 'There was an error processing your application. Please try again.');
    res.redirect('/volunteer');
  }
});

module.exports = router;