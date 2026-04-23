const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const DeliveryAgent = require('../models/DeliveryAgent');
const Review = require('../models/Review');
require('dotenv').config();

const updateAllRatings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Update Restaurant Ratings
    console.log('=== UPDATING RESTAURANT RATINGS ===\n');
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
        console.log(`✓ ${restaurant.name}: ${avgRating.toFixed(1)} stars (${approvedReviews.length} reviews)`);
      } else {
        await Restaurant.findByIdAndUpdate(restaurant._id, {
          rating: 0,
          totalReviews: 0
        });
        console.log(`○ ${restaurant.name}: No approved reviews`);
      }
    }

    // Update Delivery Agent Ratings
    console.log('\n=== UPDATING DELIVERY AGENT RATINGS ===\n');
    const agents = await DeliveryAgent.find();
    console.log(`Found ${agents.length} delivery agents\n`);
    
    for (const agent of agents) {
      const approvedReviews = await Review.find({ 
        deliveryAgent: agent._id, 
        status: 'approved' 
      });
      
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        await DeliveryAgent.findByIdAndUpdate(agent._id, {
          rating: parseFloat(avgRating.toFixed(1))
        });
        console.log(`✓ ${agent.name}: ${avgRating.toFixed(1)} stars (${approvedReviews.length} reviews)`);
      } else {
        await DeliveryAgent.findByIdAndUpdate(agent._id, {
          rating: 0
        });
        console.log(`○ ${agent.name}: No approved reviews`);
      }
    }
    
    console.log('\n✅ All ratings updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

updateAllRatings();
