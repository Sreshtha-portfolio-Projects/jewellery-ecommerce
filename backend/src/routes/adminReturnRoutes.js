const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllReturnRequests,
  getReturnRequestDetails,
  approveReturnRequest,
  rejectReturnRequest,
  markReturnReceived,
  initiateRefund,
  completeRefund
} = require('../controllers/returnController');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/returns:
 *   get:
 *     summary: Get all return requests (Admin)
 *     tags: [Admin Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, APPROVED, REJECTED, RECEIVED, REFUND_INITIATED, REFUNDED]
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
 *     responses:
 *       200:
 *         description: List of return requests
 */
router.get('/', getAllReturnRequests);

/**
 * @swagger
 * /api/admin/returns/{id}:
 *   get:
 *     summary: Get return request details (Admin)
 *     tags: [Admin Returns]
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
 *         description: Return request details
 *       404:
 *         description: Return request not found
 */
router.get('/:id', getReturnRequestDetails);

/**
 * @swagger
 * /api/admin/returns/{id}/approve:
 *   put:
 *     summary: Approve return request (Admin)
 *     tags: [Admin Returns]
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
 *             required:
 *               - returnInstructions
 *               - returnAddress
 *             properties:
 *               returnInstructions:
 *                 type: string
 *               returnAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request approved
 *       400:
 *         description: Invalid request or invalid state transition
 */
router.put('/:id/approve', approveReturnRequest);

/**
 * @swagger
 * /api/admin/returns/{id}/reject:
 *   put:
 *     summary: Reject return request (Admin)
 *     tags: [Admin Returns]
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
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request rejected
 *       400:
 *         description: Invalid request or invalid state transition
 */
router.put('/:id/reject', rejectReturnRequest);

/**
 * @swagger
 * /api/admin/returns/{id}/received:
 *   put:
 *     summary: Mark return as received (Admin)
 *     tags: [Admin Returns]
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
 *         description: Return marked as received
 *       400:
 *         description: Invalid state transition
 */
router.put('/:id/received', markReturnReceived);

/**
 * @swagger
 * /api/admin/returns/{id}/initiate-refund:
 *   put:
 *     summary: Initiate refund (Admin)
 *     tags: [Admin Returns]
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
 *         description: Refund initiated
 *       400:
 *         description: Invalid state transition
 */
router.put('/:id/initiate-refund', initiateRefund);

/**
 * @swagger
 * /api/admin/returns/{id}/complete-refund:
 *   put:
 *     summary: Complete refund (Admin)
 *     tags: [Admin Returns]
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
 *             required:
 *               - refundReference
 *             properties:
 *               refundReference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund completed
 *       400:
 *         description: Invalid request or invalid state transition
 */
router.put('/:id/complete-refund', completeRefund);

module.exports = router;
