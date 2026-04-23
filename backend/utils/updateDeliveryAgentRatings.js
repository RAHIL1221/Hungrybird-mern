const mongoose = require('mongoose');
const DeliveryAgent = require('../models/DeliveryAgent');
const Review = require('../models/Review');
require('dotenv').config();

const updateDeliveryAgentRatings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

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
        console.log(`✓ ${agent.name}: ${avgRating.toFixed(1)} stars (${approvedReviews.length} approved reviews)`);
      } else {
        await DeliveryAgent.findByIdAndUpdate(agent._id, {
          rating: 0
        });
        console.log(`○ ${agent.name}: No approved reviews (reset to 0)`);
      }
    }
    
    console.log('\n✅ All delivery agent ratings updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

updateDeliveryAgentRatings();
