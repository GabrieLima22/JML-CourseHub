const express = require('express');
const {
  getAllCourses,
  getCourseById,
  getRelatedCourses,
  getCourseStats,
  getSearchSuggestions,
} = require('../controllers/coursesController');
const { createCourse, updateCourse, setCourseStatus } = require('../controllers/coursesController');

const router = express.Router();

// Public course endpoints consumed by the React frontend
router.get('/', getAllCourses);
router.get('/stats', getCourseStats);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/:id/related', getRelatedCourses);
router.get('/:id', getCourseById);

// Admin write endpoints (simple, no auth)
router.post('/', createCourse);
router.patch('/:id', updateCourse);
router.post('/:id/status', setCourseStatus);

module.exports = router;

