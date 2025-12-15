const express = require('express');
const router = express.Router();
const { getPairedProducts, createPairing, deletePairing } = require('../controllers/productPairingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/product-pairings/product/{productId}:
 *   get:
 *     summary: Get related/paired products
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [related, complementary, similar, bought_together]
 *           default: related
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Related products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 source:
 *                   type: string
 *                   enum: [pairings, category]
 */
router.get('/product/:productId', getPairedProducts);

/**
 * @swagger
 * /api/product-pairings:
 *   post:
 *     summary: Create product pairing (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - pairedProductId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               pairedProductId:
 *                 type: string
 *                 format: uuid
 *               pairingType:
 *                 type: string
 *                 enum: [related, complementary, similar, bought_together]
 *                 default: related
 *               displayOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Pairing created
 */
router.post('/', authenticateToken, requireAdmin, createPairing);

/**
 * @swagger
 * /api/product-pairings/{pairingId}:
 *   delete:
 *     summary: Delete product pairing (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pairingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pairing deleted
 */
router.delete('/:pairingId', authenticateToken, requireAdmin, deletePairing);

module.exports = router;

