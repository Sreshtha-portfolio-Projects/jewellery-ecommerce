const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getInventoryLocks,
  releaseInventoryLock,
  getInventorySummary
} = require('../controllers/adminInventoryController');

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/inventory/locks:
 *   get:
 *     summary: Get inventory locks
 *     description: Retrieves all inventory locks, optionally filtered by status or variant ID. Shows which variants have locked stock and for which order intents.
 *     tags: [Admin Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [LOCKED, RELEASED, CONVERTED, EXPIRED]
 *         description: Filter by lock status
 *       - in: query
 *         name: variant_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by variant ID
 *     responses:
 *       200:
 *         description: List of inventory locks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryLock'
 */
router.get('/locks', getInventoryLocks);

/**
 * @swagger
 * /api/admin/inventory/summary:
 *   get:
 *     summary: Get inventory summary
 *     description: Provides an overview of inventory status including total stock, locked stock, available stock, and low stock variants.
 *     tags: [Admin Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventorySummary'
 */
router.get('/summary', getInventorySummary);

/**
 * @swagger
 * /api/admin/inventory/locks/{lockId}/release:
 *   post:
 *     summary: Release inventory lock manually
 *     description: Manually releases an inventory lock and restores stock. If all locks for an order intent are released, the order intent is automatically cancelled.
 *     tags: [Admin Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lockId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory lock ID
 *     responses:
 *       200:
 *         description: Lock released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Lock is already released or cannot be released
 *       404:
 *         description: Inventory lock not found
 */
router.post('/locks/:lockId/release', releaseInventoryLock);

module.exports = router;

