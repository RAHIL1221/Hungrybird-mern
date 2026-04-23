const express = require('express');
const router = express.Router();
const { getAdmins, createAdmin, updateAdmin, deleteAdmin, toggleAdminStatus, updateAdminPassword } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('super_admin'));
router.get('/', getAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.put('/:id/password', updateAdminPassword);
router.delete('/:id', deleteAdmin);
router.patch('/:id/toggle', toggleAdminStatus);

module.exports = router;
