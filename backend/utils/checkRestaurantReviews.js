const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const User = require('../models/User');
require('dotenv').config();

const checkRestaurantReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find Stuart littile restaurant
    const restaurant = await Restaurant.findOne({ name: /stuart/i });
    if (!restaurant) {
      console.log('Restaurant not found');
      process.exit(0);
    }

    console.log(`Restaurant: ${restaurant.name}`);
    console.log(`Current Rating: ${restaurant.rating}`);
    console.log(`Current Total Reviews: ${restaurant.totalReviews}\n`);

    // Get all reviews for this restaurant
    const allReviews = await Review.find({ restaurant: restaurant._id })
      .populate('user', 'name email')
      .sort('-createdAt');

    console.log(`Total reviews in database: ${allReviews.length}\n`);

    allReviews.forEach((review, idx) => {
      console.log(`Review ${idx + 1}:`);
      console.log(`  ID: ${review._id}`);
      console.log(`  User: ${review.user?.name || 'Unknown'}`);
      console.log(`  Rating: ${review.rating} stars`);
      console.log(`  Status: ${review.status}`);
      console.log(`  Comment: ${review.comment}`);
      console.log(`  Created: ${review.createdAt}`);
      console.log('');
    });

    const approvedCount = allReviews.filter(r => r.status === 'approved').length;
    const pendingCount = allReviews.filter(r => r.status === 'pending').length;
    const rejectedCount = allReviews.filter(r => r.status === 'rejected').length;

    console.log('Summary:');
    console.log(`  Approved: ${approvedCount}`);
    console.log(`  Pending: ${pendingCount}`);
    console.log(`  Rejected: ${rejectedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

checkRestaurantReviews();
