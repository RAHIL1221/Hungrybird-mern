const express = require('express');
const router = express.Router();
const { getUsers, getUser, toggleBlock, getUserOrders } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id/toggle-block', toggleBlock);
router.get('/:id/orders', getUserOrders);

module.exports = router;
