const express = require('express');
const router = express.Router();
const { getHealth, getLiveness, getReadiness, getSimpleHealth } = require('../controllers/healthController');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Comprehensive health check endpoint
 *     description: Checks backend status, database connectivity, and critical services (Razorpay)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check successful (ok or degraded)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded, error]
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 *                 checks:
 *                   type: object
 *                   properties:
 *                     backend:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 *                     razorpay:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                 responseTime:
 *                   type: number
 *                   description: Total health check response time in milliseconds
 *       503:
 *         description: Critical service failure
 */
router.get('/', getHealth);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe endpoint
 *     description: Simple endpoint to check if the server is alive and responding
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Server is alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/live', getLiveness);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe endpoint
 *     description: Checks if the server is ready to accept traffic (database must be available)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Server is not ready
 */
router.get('/ready', getReadiness);

module.exports = router;
