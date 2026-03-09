const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationLogs
} = require('./automation.controller');

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/automation/rules:
 *   get:
 *     summary: Get all automation rules
 *     tags: [Admin - Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of automation rules
 */
router.get('/rules', getAutomationRules);

/**
 * @swagger
 * /api/admin/automation/rules:
 *   post:
 *     summary: Create an automation rule
 *     tags: [Admin - Marketing Automation]
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
 *               - trigger_type
 *               - action_type
 *             properties:
 *               name:
 *                 type: string
 *               trigger_type:
 *                 type: string
 *                 enum: [user_signup, blog_published, cart_abandoned, order_completed, custom]
 *               action_type:
 *                 type: string
 *                 enum: [send_email, send_push, both]
 *               email_template_id:
 *                 type: string
 *               push_title:
 *                 type: string
 *               push_message:
 *                 type: string
 *               push_image:
 *                 type: string
 *               push_redirect_url:
 *                 type: string
 *               delay_minutes:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Automation rule created successfully
 */
router.post('/rules', createAutomationRule);

/**
 * @swagger
 * /api/admin/automation/rules/{id}:
 *   put:
 *     summary: Update an automation rule
 *     tags: [Admin - Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Automation rule updated successfully
 */
router.put('/rules/:id', updateAutomationRule);

/**
 * @swagger
 * /api/admin/automation/rules/{id}:
 *   delete:
 *     summary: Delete an automation rule
 *     tags: [Admin - Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Automation rule deleted successfully
 */
router.delete('/rules/:id', deleteAutomationRule);

/**
 * @swagger
 * /api/admin/automation/logs:
 *   get:
 *     summary: Get automation execution logs
 *     tags: [Admin - Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: ruleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of automation logs
 */
router.get('/logs', getAutomationLogs);

module.exports = router;
