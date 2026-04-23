const express = require('express');
const router = express.Router();
const { getDashboard, getAnalytics } = require('../controllers/dashboardController');
const { protect, hasPermission } = require('../middleware/auth');

router.use(protect);
router.use(hasPermission('dashboard'));
router.get('/', getDashboard);
router.get('/analytics', getAnalytics);

module.exports = router;
