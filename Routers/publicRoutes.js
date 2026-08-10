const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().select('title description duration level');
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

module.exports = router;
