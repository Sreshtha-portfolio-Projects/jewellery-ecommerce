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

/**
 * @swagger
 * /api/admin/pricing-rules:
 *   get:
 *     summary: Get all pricing rules
 *     tags: [Pricing Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of pricing rules
 */
router.get('/', getPricingRules);

/**
 * @swagger
 * /api/admin/pricing-rules:
 *   post:
 *     summary: Create pricing rule
 *     tags: [Pricing Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - rule_type
 *               - conditions
 *               - action_type
 *               - action_value
 *             properties:
 *               name:
 *                 type: string
 *               rule_type:
 *                 type: string
 *                 enum: [metal_markup, weight_based, category_adjustment, seasonal, custom]
 *               conditions:
 *                 type: object
 *                 description: Flexible conditions JSON object
 *               action_type:
 *                 type: string
 *                 enum: [percentage_markup, fixed_markup, percentage_discount, fixed_discount]
 *               action_value:
 *                 type: number
 *               priority:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Pricing rule created
 */
router.post('/', createPricingRule);

/**
 * @swagger
 * /api/admin/pricing-rules/{id}:
 *   put:
 *     summary: Update pricing rule
 *     tags: [Pricing Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rule updated
 */
router.put('/:id', updatePricingRule);

/**
 * @swagger
 * /api/admin/pricing-rules/{id}:
 *   delete:
 *     summary: Delete pricing rule
 *     tags: [Pricing Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rule deleted
 */
router.delete('/:id', deletePricingRule);

module.exports = router;

