const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Public Projects page - show all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    res.render('projects', {
      title: 'Our Projects - Gelelcha Charity',
      projects: projects || []
    });
  } catch (error) {
    console.error('Projects page error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading projects page'
    });
  }
});

// Public Project details page
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Project Not Found',
        message: 'The project you are looking for does not exist.'
      });
    }
    
    res.render('project-details', {
      title: project.title + ' - Gelelcha Charity',
      project
    });
  } catch (error) {
    console.error('Project details error:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Error loading project details'
    });
  }
});

module.exports = router;