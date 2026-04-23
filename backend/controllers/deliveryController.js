const DeliveryAgent = require('../models/DeliveryAgent');
const Order = require('../models/Order');

exports.getAgents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable === 'true';
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    const [agents, total] = await Promise.all([
      DeliveryAgent.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      DeliveryAgent.countDocuments(filter),
    ]);
    res.json({ success: true, data: agents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.createAgent = async (req, res, next) => {
  try {
    if (req.file) req.body.avatar = req.file.path;
    const agent = await DeliveryAgent.create(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
};

exports.updateAgent = async (req, res, next) => {
  try {
    if (req.file) req.body.avatar = req.file.path;
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    next(err);
  }
};

exports.deleteAgent = async (req, res, next) => {
  try {
    await DeliveryAgent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Agent deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getAgentDeliveries = async (req, res, next) => {
  try {
    const orders = await Order.find({ deliveryAgent: req.params.id })
      .sort('-createdAt').limit(20)
      .populate('user', 'name').populate('restaurant', 'name');
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};
