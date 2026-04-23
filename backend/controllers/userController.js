const User = require('../models/User');
const Order = require('../models/Order');

exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const orders = await Order.find({ user: req.params.id }).sort('-createdAt').limit(10).populate('restaurant', 'name');
    res.json({ success: true, data: { ...user.toObject(), recentOrders: orders } });
  } catch (err) {
    next(err);
  }
};

exports.toggleBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, data: user, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}` });
  } catch (err) {
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const [orders, total] = await Promise.all([
      Order.find({ user: req.params.id }).sort('-createdAt').skip((page - 1) * limit).limit(limit).populate('restaurant', 'name'),
      Order.countDocuments({ user: req.params.id }),
    ]);
    res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};
