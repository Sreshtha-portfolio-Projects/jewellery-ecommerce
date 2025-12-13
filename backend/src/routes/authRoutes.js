const express = require('express');
const router = express.Router();
const { login } = require('../controllers/adminAuthController');
const { rateLimit } = require('../middleware/auth');

router.post('/login', rateLimit(15 * 60 * 1000, 10), login);

module.exports = router;

