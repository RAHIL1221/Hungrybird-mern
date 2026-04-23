const Restaurant = require('../models/Restaurant');

exports.getRestaurants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).populate('owner', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Restaurant.countDocuments(filter),
    ]);
    res.json({ success: true, data: restaurants, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email phone');
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.createRestaurant = async (req, res, next) => {
  try {
    console.log('Create restaurant request:', req.body);
    if (req.file) req.body.logo = req.file.path;
    
    // Handle flattened address fields from FormData
    if (req.body['address.street'] || req.body['address.city'] || req.body['address.state'] || req.body['address.zipCode']) {
      req.body.address = {
        street: req.body['address.street'] || '',
        city: req.body['address.city'] || '',
        state: req.body['address.state'] || '',
        zipCode: req.body['address.zipCode'] || ''
      };
      // Remove flattened fields
      delete req.body['address.street'];
      delete req.body['address.city'];
      delete req.body['address.state'];
      delete req.body['address.zipCode'];
    }
    
    // Ensure required fields
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Name is required' });
    
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    console.error('Create restaurant error:', err);
    next(err);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    if (req.file) req.body.logo = req.file.path;
    
    // Handle flattened address fields from FormData
    if (req.body['address.street'] || req.body['address.city'] || req.body['address.state'] || req.body['address.zipCode']) {
      req.body.address = {
        street: req.body['address.street'] || '',
        city: req.body['address.city'] || '',
        state: req.body['address.state'] || '',
        zipCode: req.body['address.zipCode'] || ''
      };
      // Remove flattened fields
      delete req.body['address.street'];
      delete req.body['address.city'];
      delete req.body['address.state'];
      delete req.body['address.zipCode'];
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.deleteRestaurant = async (req, res, next) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};
