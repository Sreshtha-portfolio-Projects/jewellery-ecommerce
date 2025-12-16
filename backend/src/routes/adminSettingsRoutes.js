const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getSettings,
  updateSetting,
  bulkUpdateSettings
} = require('../controllers/adminSettingsController');

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all admin settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin settings
 */
router.get('/', getSettings);

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   put:
 *     summary: Update admin setting
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */
router.put('/:key', updateSetting);

/**
 * @swagger
 * /api/admin/settings/bulk:
 *   put:
 *     summary: Bulk update settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/bulk', bulkUpdateSettings);

module.exports = router;

