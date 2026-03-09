const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const {
  createCampaign,
  updateCampaign,
  getCampaigns,
  sendCampaign,
  sendImmediate,
  getCampaignAnalytics
} = require('./push.controller');

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/push/campaigns:
 *   get:
 *     summary: Get all push campaigns
 *     tags: [Admin - Push Notifications]
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
 *         description: List of push campaigns
 */
router.get('/campaigns', getCampaigns);

/**
 * @swagger
 * /api/admin/push/campaigns:
 *   post:
 *     summary: Create a push campaign
 *     tags: [Admin - Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - audience
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *               redirect_url:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [all, logged_in, vip, cart_abandoners, custom]
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
 * /api/admin/push/campaigns/{id}:
 *   put:
 *     summary: Update a push campaign
 *     tags: [Admin - Push Notifications]
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
 * /api/admin/push/campaigns/{id}/send:
 *   post:
 *     summary: Send a push campaign
 *     tags: [Admin - Push Notifications]
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
 * /api/admin/push/send:
 *   post:
 *     summary: Send immediate push notification
 *     tags: [Admin - Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               image:
 *                 type: string
 *               redirect_url:
 *                 type: string
 *               audience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */
router.post('/send', sendImmediate);

/**
 * @swagger
 * /api/admin/push/analytics:
 *   get:
 *     summary: Get push campaign analytics
 *     tags: [Admin - Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Push campaign analytics
 */
router.get('/analytics', getCampaignAnalytics);

module.exports = router;
