const express = require('express');
const os = require('os');
const adminStatsController = require('../controllers/adminStatsController');

const router = express.Router();

// Simple admin dashboard metadata so the frontend can confirm connectivity
router.get('/', (req, res) => {
  res.apiResponse(
    {
      service: 'JML CourseHub Admin API',
      version: '1.0.0',
      uptime: process.uptime(),
      hostname: os.hostname(),
    },
    'Admin API ativo'
  );
});

router.get('/health', (req, res) => {
  res.apiResponse(
    {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node: process.version,
    },
    'Admin healthcheck'
  );
});

// Rotas de estatísticas do admin
router.get('/stats/dashboard', adminStatsController.getDashboardStats);
router.get('/stats/activities', adminStatsController.getRecentActivities);
router.get('/stats/analytics', adminStatsController.getDetailedAnalytics);
router.get('/stats/ai-metrics', adminStatsController.getAIMetrics);

module.exports = router;
