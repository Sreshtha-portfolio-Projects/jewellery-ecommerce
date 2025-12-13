const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkHealth } = require('../controllers/adminController');

// All admin routes require authentication
router.use(authenticateToken);

router.get('/health', checkHealth);

module.exports = router;

