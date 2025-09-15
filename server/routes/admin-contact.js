const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Simple auth middleware
const auth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/admin/login');
};

// Admin contacts management
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.render('admin/manage-contacts', {
      title: 'Manage Contacts - Gelelcha Admin',
      adminName: req.session.adminName,
      contacts: contacts,
      currentPage: 'contacts'
    });
  } catch (error) {
    console.error('Contacts page error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading contacts'
    });
  }
});

// Contact details
router.get('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    res.render('admin/contact-details', {
      title: 'Contact Details - Gelelcha Admin',
      adminName: req.session.adminName,
      contact: contact,
      currentPage: 'contacts'
    });
  } catch (error) {
    console.error('Contact details error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading contact details'
    });
  }
});

// Delete contact
router.post('/delete/:id', auth, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Contact message deleted successfully');
    res.redirect('/admin/contacts');
  } catch (error) {
    console.error('Error deleting contact:', error);
    req.flash('error_msg', 'Error deleting contact message');
    res.redirect('/admin/contacts');
  }
});

module.exports = router;