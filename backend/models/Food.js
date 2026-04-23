const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  image: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  variants: [{
    name: String,
    options: [{ label: String, price: Number }],
  }],
  tags: [String],
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  stock: { type: Number, default: -1 },
  preparationTime: { type: Number, default: 15 },
  calories: { type: Number },
  allergens: [String],
}, { timestamps: true });

foodSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Food', foodSchema);
