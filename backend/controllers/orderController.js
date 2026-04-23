const Order = require('../models/Order');

const buildQuery = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter['payment.status'] = query.paymentStatus;
  if (query.restaurant) filter.restaurant = query.restaurant;
  if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

exports.getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = buildQuery(req.query);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .populate('restaurant', 'name')
        .populate('deliveryAgent', 'name phone')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone addresses')
      .populate('restaurant', 'name phone address')
      .populate('items.food', 'name image')
      .populate('deliveryAgent')
      .populate('statusHistory.updatedBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.admin.id });
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      
      // Update delivery agent earnings and total deliveries
      if (order.deliveryAgent && order.deliveryAgentFee > 0) {
        const DeliveryAgent = require('../models/DeliveryAgent');
        await DeliveryAgent.findByIdAndUpdate(order.deliveryAgent, {
          $inc: { earnings: order.deliveryAgentFee, totalDeliveries: 1 }
        });
      }
    }
    await order.save();

    // Populate fields before sending response
    await order.populate([
      { path: 'user', select: 'name email phone addresses' },
      { path: 'restaurant', select: 'name phone address' },
      { path: 'deliveryAgent' },
      { path: 'items.food', select: 'name image' },
      { path: 'statusHistory.updatedBy', select: 'name' }
    ]);

    const io = req.app.get('io');
    if (io) io.emit(`order:${order._id}`, { status, orderNumber: order.orderNumber });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.assignDeliveryAgent = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryAgent: agentId, status: 'out_for_delivery' },
      { new: true }
    )
    .populate('user', 'name email phone addresses')
    .populate('restaurant', 'name phone address')
    .populate('deliveryAgent')
    .populate('items.food', 'name image')
    .populate('statusHistory.updatedBy', 'name');
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
