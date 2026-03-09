const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const {
  getSubscribers,
  getSubscriberStats,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createCampaign,
  updateCampaign,
  getCampaigns,
  sendCampaign,
  getCampaignAnalytics
} = require('./email.controller');

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/email/subscribers:
 *   get:
 *     summary: Get all email subscribers
 *     tags: [Admin - Email Marketing]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subscribers
 */
router.get('/subscribers', getSubscribers);

/**
 * @swagger
 * /api/admin/email/subscribers/stats:
 *   get:
 *     summary: Get subscriber statistics
 *     tags: [Admin - Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriber statistics
 */
router.get('/subscribers/stats', getSubscriberStats);

/**
 * @swagger
 * /api/admin/email/templates:
 *   get:
 *     summary: Get all email templates
 *     tags: [Admin - Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of email templates
 */
router.get('/templates', getTemplates);

/**
 * @swagger
 * /api/admin/email/templates/{id}:
 *   get:
 *     summary: Get email template by ID
 *     tags: [Admin - Email Marketing]
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
 *         description: Email template details
 */
router.get('/templates/:id', getTemplateById);

/**
 * @swagger
 * /api/admin/email/templates:
 *   post:
 *     summary: Create an email template
 *     tags: [Admin - Email Marketing]
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
 *               - subject
 *               - html
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *               variables:
 *                 type: object
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/templates', createTemplate);

/**
 * @swagger
 * /api/admin/email/templates/{id}:
 *   put:
 *     summary: Update an email template
 *     tags: [Admin - Email Marketing]
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
 *         description: Template updated successfully
 */
router.put('/templates/:id', updateTemplate);

/**
 * @swagger
 * /api/admin/email/templates/{id}:
 *   delete:
 *     summary: Delete an email template
 *     tags: [Admin - Email Marketing]
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
 *         description: Template deleted successfully
 */
router.delete('/templates/:id', deleteTemplate);

/**
 * @swagger
 * /api/admin/email/campaigns:
 *   get:
 *     summary: Get all email campaigns
 *     tags: [Admin - Email Marketing]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of email campaigns
 */
router.get('/campaigns', getCampaigns);

/**
 * @swagger
 * /api/admin/email/campaigns:
 *   post:
 *     summary: Create an email campaign
 *     tags: [Admin - Email Marketing]
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
 *               - subject
 *               - audience
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               template_id:
 *                 type: string
 *               html_content:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [all, subscribers, customers, vip, cart_abandoners, custom]
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.post('/campaigns', createCampaign);

/**
 * @swagger
 * /api/admin/email/campaigns/{id}:
 *   put:
 *     summary: Update an email campaign
 *     tags: [Admin - Email Marketing]
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
 *         description: Campaign updated successfully
 */
router.put('/campaigns/:id', updateCampaign);

/**
 * @swagger
 * /api/admin/email/campaigns/{id}/send:
 *   post:
 *     summary: Send an email campaign
 *     tags: [Admin - Email Marketing]
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
 *         description: Campaign sent successfully
 */
router.post('/campaigns/:id/send', sendCampaign);

/**
 * @swagger
 * /api/admin/email/analytics:
 *   get:
 *     summary: Get email campaign analytics
 *     tags: [Admin - Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email campaign analytics
 */
router.get('/analytics', getCampaignAnalytics);

module.exports = router;
