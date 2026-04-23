const express = require('express');
const router = express.Router();
const { getRestaurants, getRestaurant, getFeaturedRestaurants, getCategories, getFeaturedFoods, searchFoods } = require('../controllers/customerMenuController');

router.get('/restaurants', getRestaurants);
router.get('/restaurants/featured', getFeaturedRestaurants);
router.get('/restaurants/:id', getRestaurant);
router.get('/categories', getCategories);
router.get('/foods/featured', getFeaturedFoods);
router.get('/foods/search', searchFoods);

module.exports = router;
