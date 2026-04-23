const Order = require('../models/Order');
const User = require('../models/User');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');

exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOrders, totalUsers, totalRestaurants, totalFoods,
      monthOrders, lastMonthOrders,
      revenueData, lastMonthRevenue,
      recentOrders, ordersByStatus,
      dailyRevenue,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Restaurant.countDocuments({ status: 'approved' }),
      Food.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find().sort('-createdAt').limit(10)
        .populate('user', 'name email')
        .populate('restaurant', 'name'),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { 'payment.status': 'paid', createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const lastMonthRev = lastMonthRevenue[0]?.total || 0;
    const monthRev = await Order.aggregate([
      { $match: { 'payment.status': 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalUsers,
          totalRestaurants,
          totalFoods,
          totalRevenue,
          monthOrders,
          monthRevenue: monthRev[0]?.total || 0,
          orderGrowth: lastMonthOrders ? (((monthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1) : 0,
          revenueGrowth: lastMonthRev ? ((((monthRev[0]?.total || 0) - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : 0,
        },
        recentOrders,
        ordersByStatus,
        dailyRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [revenueByDay, topFoods, topRestaurants, userGrowth] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, 'payment.status': 'paid' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.food', name: { $first: '$items.name' }, totalOrders: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
        { $sort: { totalOrders: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, 'payment.status': 'paid' } },
        { $group: { _id: '$restaurant', totalOrders: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
        { $unwind: '$restaurant' },
        { $project: { name: '$restaurant.name', totalOrders: 1, revenue: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ success: true, data: { revenueByDay, topFoods, topRestaurants, userGrowth } });
  } catch (err) {
    next(err);
  }
};
