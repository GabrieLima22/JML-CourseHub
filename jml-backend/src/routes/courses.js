const express = require('express');
const {
  getAllCourses,
  getCourseById,
  getRelatedCourses,
  getCourseStats,
  getSearchSuggestions,
  aiSearch,
  createCourse,
  updateCourse,
  setCourseStatus,
  deleteCourse,
} = require('../controllers/coursesController');

const router = express.Router();

// Public course endpoints consumed by the React frontend
router.get('/', getAllCourses);
router.get('/stats', getCourseStats);
router.get('/search/suggestions', getSearchSuggestions);
router.post('/ai-search', aiSearch); // 🤖 Busca inteligente com IA
router.get('/:id/related', getRelatedCourses);
router.get('/:id', getCourseById);

// Admin write endpoints (simple, no auth)
router.post('/', createCourse);
router.patch('/:id', updateCourse);
router.post('/:id/status', setCourseStatus);
router.delete('/:id', deleteCourse);

module.exports = router;

