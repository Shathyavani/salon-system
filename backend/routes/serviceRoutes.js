const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  getServices, addService, updateService, deleteService
} = require('../controllers/serviceController');

router.get('/', getServices);
router.post('/', verifyToken, isAdmin, addService);
router.put('/:id', verifyToken, isAdmin, updateService);
router.delete('/:id', verifyToken, isAdmin, deleteService);

module.exports = router;