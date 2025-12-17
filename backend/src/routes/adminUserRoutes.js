const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  grantAdminRole,
  revokeAdminRole,
  getUserRoles
} = require('../controllers/adminUserController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with their roles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with roles
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/roles:
 *   get:
 *     summary: Get roles for a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User roles
 */
router.get('/:userId/roles', getUserRoles);

/**
 * @swagger
 * /api/admin/users/{userId}/roles/admin:
 *   post:
 *     summary: Grant admin role to a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional notes about why admin role is granted
 *     responses:
 *       200:
 *         description: Admin role granted successfully
 *       400:
 *         description: User already has admin role
 *       404:
 *         description: User not found
 */
router.post('/:userId/roles/admin', grantAdminRole);

/**
 * @swagger
 * /api/admin/users/{userId}/roles/admin:
 *   delete:
 *     summary: Revoke admin role from a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Admin role revoked successfully
 *       400:
 *         description: Cannot revoke your own admin role
 *       404:
 *         description: User does not have admin role
 */
router.delete('/:userId/roles/admin', revokeAdminRole);

module.exports = router;

