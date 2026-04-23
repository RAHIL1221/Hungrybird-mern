const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
require('dotenv').config();

const updateRestaurantRatings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find();
    console.log(`Found ${restaurants.length} restaurants\n`);
    
    for (const restaurant of restaurants) {
      const approvedReviews = await Review.find({ 
        restaurant: restaurant._id, 
        status: 'approved' 
      });
      
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          rating: parseFloat(avgRating.toFixed(1)),
          totalReviews: approvedReviews.length
        });
        console.log(`✓ ${restaurant.name}: ${avgRating.toFixed(1)} stars (${approvedReviews.length} approved reviews)`);
      } else {
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          rating: 0,
          totalReviews: 0
        });
        console.log(`○ ${restaurant.name}: No approved reviews (reset to 0)`);
      }
    }
    
    console.log('\n✅ All restaurant ratings updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

updateRestaurantRatings();
