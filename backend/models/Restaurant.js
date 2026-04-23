const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  email: { type: String },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number },
  },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  cuisine: [String],
  openingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'approved' },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  deliveryTime: { type: String, default: '30-45 min' },
  minOrder: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  commission: { type: Number, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
