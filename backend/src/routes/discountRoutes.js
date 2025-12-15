const express = require('express');
const router = express.Router();
const { getDiscounts, validateDiscount, createDiscount, updateDiscount, deleteDiscount } = require('../controllers/discountController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     summary: Validate discount code
 *     tags: [Discounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount/coupon code
 *               cartTotal:
 *                 type: number
 *                 description: Total cart amount
 *     responses:
 *       200:
 *         description: Discount validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 discount:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     discount_type:
 *                       type: string
 *                       enum: [percentage, flat]
 *                     discount_value:
 *                       type: number
 *                     discount_amount:
 *                       type: number
 *       400:
 *         description: Invalid discount code
 */
router.post('/validate', validateDiscount);

// Authenticated routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all discounts (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of discounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   code:
 *                     type: string
 *                   discount_type:
 *                     type: string
 *                   discount_value:
 *                     type: number
 *                   is_active:
 *                     type: boolean
 *                   valid_from:
 *                     type: string
 *                     format: date-time
 *                   valid_until:
 *                     type: string
 *                     format: date-time
 */
router.get('/', getDiscounts);

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create discount code (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount_type
 *               - discount_value
 *             properties:
 *               code:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [percentage, flat]
 *               discount_value:
 *                 type: number
 *               min_cart_value:
 *                 type: number
 *               max_uses:
 *                 type: integer
 *               valid_from:
 *                 type: string
 *                 format: date-time
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Discount created
 */
router.post('/', requireAdmin, createDiscount);

/**
 * @swagger
 * /api/discounts/{id}:
 *   put:
 *     summary: Update discount (admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discount_value:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Discount updated
 */
router.put('/:id', requireAdmin, updateDiscount);

/**
 * @swagger
 * /api/discounts/{id}:
 *   delete:
 *     summary: Delete discount (admin only)
 *     tags: [Discounts]
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
 *         description: Discount deleted
 */
router.delete('/:id', requireAdmin, deleteDiscount);

module.exports = router;

