const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getMyOrder, cancelOrder, validateCoupon, submitReview } = require('../controllers/customerOrderController');
const { protectUser } = require('../middleware/auth');

router.use(protectUser);
router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/:id', getMyOrder);
router.patch('/:id/cancel', cancelOrder);
router.post('/validate-coupon', validateCoupon);
router.post('/review', submitReview);

module.exports = router;
