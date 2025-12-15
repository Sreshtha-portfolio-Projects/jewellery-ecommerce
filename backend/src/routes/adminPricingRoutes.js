const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
} = require('../controllers/adminPricingController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getPricingRules);
router.post('/', createPricingRule);
router.put('/:id', updatePricingRule);
router.delete('/:id', deletePricingRule);

module.exports = router;

