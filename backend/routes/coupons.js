const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);
router.patch('/:id/toggle', toggleCoupon);

module.exports = router;
