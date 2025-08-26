const express = require('express');
const router = express.Router();

// Donation page
router.get('/', (req, res) => {
  res.render('donate', {
    title: 'Donate - Gelelcha Charity'
  });
});

// Donation form submission
router.post('/', (req, res) => {
  // For now, just show a success message
  req.flash('success_msg', 'Thank you for your donation!');
  res.redirect('/donate');
});

module.exports = router;