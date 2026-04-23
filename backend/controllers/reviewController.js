const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const DeliveryAgent = require('../models/DeliveryAgent');

exports.getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.restaurant) filter.restaurant = req.query.restaurant;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name email avatar')
        .populate('restaurant', 'name')
        .populate('food', 'name')
        .populate('deliveryAgent', 'name')
        .sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Review.countDocuments(filter),
    ]);
    res.json({ success: true, data: reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    
    // Update restaurant rating when review is approved or rejected
    if (review.restaurant && (status === 'approved' || status === 'rejected')) {
      const approvedReviews = await Review.find({ restaurant: review.restaurant, status: 'approved' });
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        await Restaurant.findByIdAndUpdate(review.restaurant, {
          rating: parseFloat(avgRating.toFixed(1)),
          totalReviews: approvedReviews.length
        });
      } else {
        await Restaurant.findByIdAndUpdate(review.restaurant, {
          rating: 0,
          totalReviews: 0
        });
      }
    }
    
    // Update delivery agent rating when review is approved or rejected
    if (review.deliveryAgent && (status === 'approved' || status === 'rejected')) {
      const approvedReviews = await Review.find({ deliveryAgent: review.deliveryAgent, status: 'approved' });
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        await DeliveryAgent.findByIdAndUpdate(review.deliveryAgent, {
          rating: parseFloat(avgRating.toFixed(1))
        });
      } else {
        await DeliveryAgent.findByIdAndUpdate(review.deliveryAgent, {
          rating: 0
        });
      }
    }
    
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    
    const restaurantId = review.restaurant;
    const deliveryAgentId = review.deliveryAgent;
    await Review.findByIdAndDelete(req.params.id);
    
    // Update restaurant rating after deletion
    if (restaurantId) {
      const approvedReviews = await Review.find({ restaurant: restaurantId, status: 'approved' });
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        await Restaurant.findByIdAndUpdate(restaurantId, {
          rating: parseFloat(avgRating.toFixed(1)),
          totalReviews: approvedReviews.length
        });
      } else {
        await Restaurant.findByIdAndUpdate(restaurantId, {
          rating: 0,
          totalReviews: 0
        });
      }
    }
    
    // Update delivery agent rating after deletion
    if (deliveryAgentId) {
      const approvedReviews = await Review.find({ deliveryAgent: deliveryAgentId, status: 'approved' });
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        await DeliveryAgent.findByIdAndUpdate(deliveryAgentId, {
          rating: parseFloat(avgRating.toFixed(1))
        });
      } else {
        await DeliveryAgent.findByIdAndUpdate(deliveryAgentId, {
          rating: 0
        });
      }
    }
    
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};
