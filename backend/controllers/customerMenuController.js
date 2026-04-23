const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Category = require('../models/Category');

exports.getRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, sort = '-rating', page = 1, limit = 12 } = req.query;
    const filter = { status: 'approved', isActive: true };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (cuisine) filter.cuisine = { $in: [cuisine] };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort(sort).skip((page - 1) * limit).limit(parseInt(limit)),
      Restaurant.countDocuments(filter),
    ]);
    res.json({ success: true, data: restaurants, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ _id: req.params.id, status: 'approved', isActive: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const [foods, categories] = await Promise.all([
      Food.find({ restaurant: req.params.id, isAvailable: true }).populate('category', 'name'),
      Category.find({ isActive: true }).sort('sortOrder'),
    ]);

    // Group foods by category
    const menu = categories.map(cat => ({
      category: cat,
      items: foods.filter(f => f.category?._id?.toString() === cat._id.toString()),
    })).filter(g => g.items.length > 0);

    res.json({ success: true, data: { restaurant, menu } });
  } catch (err) { next(err); }
};

exports.getFeaturedRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ status: 'approved', isActive: true }).sort('-rating').limit(6);
    res.json({ success: true, data: restaurants });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

exports.getFeaturedFoods = async (req, res, next) => {
  try {
    // Get foods that are featured OR just available (if no featured foods exist)
    let foods = await Food.find({ isFeatured: true, isAvailable: true })
      .populate('restaurant', 'name deliveryTime deliveryFee status isActive')
      .populate('category', 'name')
      .limit(8);
    
    // Filter out foods from non-approved or inactive restaurants
    foods = foods.filter(f => f.restaurant?.status === 'approved' && f.restaurant?.isActive);
    
    // If no featured foods, get any available foods
    if (foods.length === 0) {
      const allFoods = await Food.find({ isAvailable: true })
        .populate('restaurant', 'name deliveryTime deliveryFee status isActive')
        .populate('category', 'name')
        .limit(8);
      foods = allFoods.filter(f => f.restaurant?.status === 'approved' && f.restaurant?.isActive);
    }
    
    res.json({ success: true, data: foods });
  } catch (err) { next(err); }
};

exports.searchFoods = async (req, res, next) => {
  try {
    const { q, category, restaurant, minPrice, maxPrice, isVeg } = req.query;
    const filter = { isAvailable: true };
    if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
    if (category) filter.category = category;
    if (restaurant) filter.restaurant = restaurant;
    if (isVeg === 'true') filter.isVeg = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    const foods = await Food.find(filter)
      .populate('category', 'name')
      .populate('restaurant', 'name deliveryTime deliveryFee status isActive')
      .sort('-rating').limit(40);
    res.json({ success: true, data: foods });
  } catch (err) { next(err); }
};
