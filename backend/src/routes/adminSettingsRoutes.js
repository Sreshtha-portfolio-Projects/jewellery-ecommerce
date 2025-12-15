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
 *     description: Retrieves all admin settings, optionally filtered by category. Settings are organized by category (pricing, tax, shipping, inventory, checkout).
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [pricing, tax, shipping, inventory, checkout, general]
 *         description: Filter settings by category
 *     responses:
 *       200:
 *         description: Admin settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   description: Settings organized by category
 *                 raw:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminSetting'
 */
router.get('/', getSettings);

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   put:
 *     summary: Update admin setting
 *     description: Updates a single admin setting. Value type is validated based on the setting's type (string, number, boolean, json).
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key (e.g., 'tax_percentage', 'shipping_charge')
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
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                 description: Setting value (type must match setting's type)
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 setting:
 *                   $ref: '#/components/schemas/AdminSetting'
 *       400:
 *         description: Invalid value type
 *       404:
 *         description: Setting not found
 */
router.put('/:key', updateSetting);

/**
 * @swagger
 * /api/admin/settings/bulk:
 *   put:
 *     summary: Bulk update settings
 *     description: Updates multiple settings at once. Returns count of updated settings and any errors encountered.
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *                     - type: boolean
 *                 description: Object with setting keys as properties and values to update
 *                 example:
 *                   tax_percentage: 18
 *                   shipping_charge: 50
 *                   checkout_enabled: true
 *     responses:
 *       200:
 *         description: Settings updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updated:
 *                   type: integer
 *                   description: Number of settings successfully updated
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Array of errors for settings that failed to update
 */
router.put('/bulk', bulkUpdateSettings);

module.exports = router;

