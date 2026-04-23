const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  images: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: String,
  isVerifiedPurchase: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
