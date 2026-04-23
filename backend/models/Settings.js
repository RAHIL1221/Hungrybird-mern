const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: mongoose.Schema.Types.Mixed,
  group: { type: String, enum: ['general', 'payment', 'delivery', 'tax', 'notification', 'social'] },
  label: String,
  type: { type: String, enum: ['string', 'number', 'boolean', 'json'], default: 'string' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
