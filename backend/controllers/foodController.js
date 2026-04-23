const Food = require('../models/Food');
const Category = require('../models/Category');

exports.getFoods = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.restaurant) filter.restaurant = req.query.restaurant;
    if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable === 'true';
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [foods, total] = await Promise.all([
      Food.find(filter).populate('category', 'name').populate('restaurant', 'name')
        .sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Food.countDocuments(filter),
    ]);
    res.json({ success: true, data: foods, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id).populate('category').populate('restaurant', 'name');
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
};

exports.createFood = async (req, res, next) => {
  try {
    console.log('Create food request:', req.body);
    console.log('Uploaded file:', req.file);
    if (req.file) {
      console.log('File path before:', req.file.path);
      req.body.image = req.file.path;
      console.log('Image path saved:', req.body.image);
    }
    
    // Ensure required fields
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!req.body.price) return res.status(400).json({ success: false, message: 'Price is required' });
    if (!req.body.category) return res.status(400).json({ success: false, message: 'Category is required' });
    if (!req.body.restaurant) return res.status(400).json({ success: false, message: 'Restaurant is required' });
    
    const food = await Food.create(req.body);
    console.log('Food created with image:', food.image);
    res.status(201).json({ success: true, data: food });
  } catch (err) {
    console.error('Create food error:', err);
    next(err);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    if (req.file) req.body.image = req.file.path;
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
};

exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, message: 'Food deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    food.isAvailable = !food.isAvailable;
    await food.save();
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
};

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('sortOrder');
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    if (req.file) req.body.image = req.file.path;
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    if (req.file) req.body.image = req.file.path;
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};
