const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');

exports.placeOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, couponCode, notes } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });

    // Get restaurant for commission rate
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Get tax rate from settings
    const settings = await Settings.find({ key: { $in: ['tax_rate'] } });
    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    const deliveryFee = restaurant.deliveryFee || 0;
    const taxRate = parseFloat(settingsMap.tax_rate || 8) / 100;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));

    // Validate coupon
    let discount = 0;
    let couponData = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiryDate: { $gte: new Date() } });
      if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
      if (subtotal < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order value is $${coupon.minOrderValue}` });
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      discount = coupon.type === 'percentage'
        ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : coupon.value;
      discount = parseFloat(discount.toFixed(2));
      couponData = { code: coupon.code, discount };
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    }

    const total = parseFloat((subtotal + deliveryFee + tax - discount).toFixed(2));
    
    // Calculate commission and restaurant earnings
    const commissionRate = restaurant.commission || 0;
    const commission = parseFloat((subtotal * (commissionRate / 100)).toFixed(2));
    const restaurantEarnings = parseFloat((subtotal - commission).toFixed(2));
    
    // Delivery agent gets the full delivery fee
    const deliveryAgentFee = deliveryFee;

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: items.map(i => ({ food: i.foodId, name: i.name, price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity, variants: i.variants || [] })),
      deliveryAddress,
      payment: { method: paymentMethod || 'cash', status: paymentMethod === 'cash' ? 'pending' : 'pending' },
      coupon: couponData,
      subtotal, deliveryFee, tax, discount, commission, commissionRate, restaurantEarnings, deliveryAgentFee, total,
      notes,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalOrders: 1, totalSpent: total } });

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to('admin-room').emit('new:order', { orderId: order._id, orderNumber: order.orderNumber, total });

    const populated = await Order.findById(order._id).populate('restaurant', 'name logo deliveryTime');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit)
        .populate('restaurant', 'name logo deliveryTime'),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('restaurant', 'name logo phone address deliveryTime')
      .populate('items.food', 'name image')
      .populate('deliveryAgent', 'name phone vehicleType');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Cancelled by customer' });
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, expiryDate: { $gte: new Date() } });
    if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    if (subtotal < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order $${coupon.minOrderValue} required` });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon limit reached' });
    const discount = coupon.type === 'percentage'
      ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;
    res.json({ success: true, data: { code: coupon.code, type: coupon.type, value: coupon.value, discount: parseFloat(discount.toFixed(2)), description: coupon.description } });
  } catch (err) { next(err); }
};

exports.submitReview = async (req, res, next) => {
  try {
    const Review = require('../models/Review');
    const { orderId, restaurantId, deliveryAgentId, foodId, rating, comment } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id, status: 'delivered' });
    if (!order) return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    
    const reviewData = {
      user: req.user._id,
      order: orderId,
      rating,
      comment,
      isVerifiedPurchase: true
    };
    
    if (restaurantId) reviewData.restaurant = restaurantId;
    if (deliveryAgentId) reviewData.deliveryAgent = deliveryAgentId;
    if (foodId) reviewData.food = foodId;
    
    const review = await Review.create(reviewData);
    res.status(201).json({ success: true, data: review, message: 'Review submitted for approval' });
  } catch (err) { next(err); }
};
