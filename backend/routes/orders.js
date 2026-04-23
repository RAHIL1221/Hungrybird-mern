const express = require('express');
const router = express.Router();
const { getOrders, getOrder, updateOrderStatus, assignDeliveryAgent, getOrderStats } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/assign-agent', assignDeliveryAgent);

module.exports = router;
