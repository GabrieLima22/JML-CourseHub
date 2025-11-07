const express = require('express');
const {
  getAllCourses,
  getCourseById,
  getRelatedCourses,
  getCourseStats,
  getSearchSuggestions,
} = require('../controllers/coursesController');

const router = express.Router();

// Public course endpoints consumed by the React frontend
router.get('/', getAllCourses);
router.get('/stats', getCourseStats);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/:id/related', getRelatedCourses);
router.get('/:id', getCourseById);

module.exports = router;
