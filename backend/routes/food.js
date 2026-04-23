const express = require('express');
const router = express.Router();
const { getFoods, getFood, createFood, updateFood, deleteFood, toggleAvailability, getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/foodController');
const { protect } = require('../middleware/auth');
const { upload, formatFilePath } = require('../config/cloudinary');

router.use(protect);
router.get('/categories', getCategories);
router.post('/categories', upload.single('image'), formatFilePath, createCategory);
router.put('/categories/:id', upload.single('image'), formatFilePath, updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/', getFoods);
router.post('/', upload.single('image'), formatFilePath, createFood);
router.get('/:id', getFood);
router.put('/:id', upload.single('image'), formatFilePath, updateFood);
router.delete('/:id', deleteFood);
router.patch('/:id/toggle', toggleAvailability);

module.exports = router;
