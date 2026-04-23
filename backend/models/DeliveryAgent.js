const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  avatar: { type: String, default: '' },
  vehicleType: { type: String, enum: ['bike', 'scooter', 'car', 'bicycle'], default: 'bike' },
  vehicleNumber: String,
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  currentLocation: { lat: Number, lng: Number },
  totalDeliveries: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  zone: String,
}, { timestamps: true });

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
