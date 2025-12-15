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
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: variant_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory locks
 */
router.get('/locks', getInventoryLocks);

/**
 * @swagger
 * /api/admin/inventory/summary:
 *   get:
 *     summary: Get inventory summary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary
 */
router.get('/summary', getInventorySummary);

/**
 * @swagger
 * /api/admin/inventory/locks/{lockId}/release:
 *   post:
 *     summary: Release inventory lock
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lockId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lock released
 */
router.post('/locks/:lockId/release', releaseInventoryLock);

module.exports = router;

