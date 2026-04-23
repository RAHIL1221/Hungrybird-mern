const express = require('express');
const router = express.Router();
const { getReviews, updateReviewStatus, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getReviews);
router.put('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

module.exports = router;
