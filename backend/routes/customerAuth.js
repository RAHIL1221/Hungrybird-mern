const express = require('express');
const router = express.Router();
const { register, login, refreshToken, getMe, updateProfile, changePassword, addAddress, updateAddress, deleteAddress } = require('../controllers/customerAuthController');
const { protectUser } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.use(protectUser);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/addresses', addAddress);
router.put('/addresses/:addrId', updateAddress);
router.delete('/addresses/:addrId', deleteAddress);

module.exports = router;
