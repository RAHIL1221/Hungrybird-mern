const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getSettingsByGroup, getPublicSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public', getPublicSettings);
router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('super_admin', 'manager'), updateSettings);
router.get('/:group', getSettingsByGroup);

module.exports = router;
