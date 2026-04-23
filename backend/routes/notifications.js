const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, updateNotification, sendNotification, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.post('/:id/send', sendNotification);
router.delete('/:id', deleteNotification);

module.exports = router;
