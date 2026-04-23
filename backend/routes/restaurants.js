const express = require('express');
const router = express.Router();
const { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, updateStatus } = require('../controllers/restaurantController');
const { protect } = require('../middleware/auth');
const { upload, formatFilePath } = require('../config/cloudinary');

router.use(protect);
router.get('/', getRestaurants);
router.post('/', upload.single('logo'), formatFilePath, createRestaurant);
router.get('/:id', getRestaurant);
router.put('/:id', upload.single('logo'), formatFilePath, updateRestaurant);
router.delete('/:id', deleteRestaurant);
router.patch('/:id/status', updateStatus);

module.exports = router;
