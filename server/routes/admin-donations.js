const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Simple auth middleware
const auth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/admin/login');
};

// Admin donations management
router.get('/', auth, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.render('admin/manage-donations', {
      title: 'Manage Donations - Gelelcha Admin',
      adminName: req.session.adminName,
      donations: donations,
      currentPage: 'donations'
    });
  } catch (error) {
    console.error('Donations page error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading donations'
    });
  }
});

// Donation details
router.get('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    res.render('admin/donation-details', {
      title: 'Donation Details - Gelelcha Admin',
      adminName: req.session.adminName,
      donation: donation,
      currentPage: 'donations'
    });
  } catch (error) {
    console.error('Donation details error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading donation details'
    });
  }
});

// Delete donation
router.post('/delete/:id', auth, async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Donation record deleted successfully');
    res.redirect('/admin/donations');
  } catch (error) {
    console.error('Error deleting donation:', error);
    req.flash('error_msg', 'Error deleting donation record');
    res.redirect('/admin/donations');
  }
});

module.exports = router;