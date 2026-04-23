const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'promotion', 'system', 'alert'], default: 'system' },
  target: { type: String, enum: ['all', 'specific', 'segment'], default: 'all' },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  channels: [{ type: String, enum: ['push', 'email', 'sms'] }],
  status: { type: String, enum: ['draft', 'sent', 'scheduled'], default: 'draft' },
  scheduledAt: Date,
  sentAt: Date,
  sentCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
