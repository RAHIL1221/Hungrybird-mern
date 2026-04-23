const express = require('express');
const router = express.Router();
const { getAgents, createAgent, updateAgent, deleteAgent, getAgentDeliveries } = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect);
router.get('/', getAgents);
router.post('/', upload.single('avatar'), createAgent);
router.put('/:id', upload.single('avatar'), updateAgent);
router.delete('/:id', deleteAgent);
router.get('/:id/deliveries', getAgentDeliveries);

module.exports = router;
