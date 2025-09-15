const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');

// Simple auth middleware
const auth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/admin/login');
};

// Admin volunteers management
router.get('/', auth, async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    res.render('admin/manage-volunteers', {
      title: 'Manage Volunteers - Gelelcha Admin',
      adminName: req.session.adminName,
      volunteers: volunteers,
      currentPage: 'volunteers'
    });
  } catch (error) {
    console.error('Volunteers page error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading volunteers'
    });
  }
});

// Volunteer details
router.get('/:id', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    res.render('admin/volunteer-details', {
      title: 'Volunteer Details - Gelelcha Admin',
      adminName: req.session.adminName,
      volunteer: volunteer,
      currentPage: 'volunteers'
    });
  } catch (error) {
    console.error('Volunteer details error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading volunteer details'
    });
  }
});

// Delete volunteer
router.post('/delete/:id', auth, async (req, res) => {
  try {
    await Volunteer.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Volunteer application deleted successfully');
    res.redirect('/admin/volunteers');
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    req.flash('error_msg', 'Error deleting volunteer application');
    res.redirect('/admin/volunteers');
  }
});

module.exports = router;