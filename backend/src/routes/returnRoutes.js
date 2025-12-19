const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const {
  createReturnRequest,
  getReturnRequestByOrder,
  getAllReturnRequests,
  getReturnRequestDetails,
  approveReturnRequest,
  rejectReturnRequest,
  markReturnReceived,
  initiateRefund,
  completeRefund
} = require('../controllers/returnController');

// User routes (authenticated)
router.use(authenticateToken);

/**
 * @swagger
 * /api/returns:
 *   post:
 *     summary: Create a return request
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - returnReason
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               returnReason:
 *                 type: string
 *                 enum: [Size issue, Damaged item, Not as expected]
 *               returnNote:
 *                 type: string
 *     responses:
 *       201:
 *         description: Return request created
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 */
router.post('/', createReturnRequest);

/**
 * @swagger
 * /api/returns/order/{orderId}:
 *   get:
 *     summary: Get return request by order ID
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Return request details
 *       404:
 *         description: Return request not found
 */
router.get('/order/:orderId', getReturnRequestByOrder);


module.exports = router;
