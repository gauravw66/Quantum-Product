const express = require('express');
const router = express.Router();
const quantumController = require('../controllers/quantumController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Quantum
 *   description: IBM Quantum integration endpoints
 */

/**
 * @swagger
 * /quantum/connect:
 *   post:
 *     summary: Connect an IBM Quantum API Key
 *     tags: [Quantum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               provider:
 *                 type: string
 *               backendName:
 *                 type: string
 *               instance:
 *                 type: string
 *     responses:
 *       201:
 *         description: Connected successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/connect', authMiddleware, quantumController.connectQuantum);

/**
 * @swagger
 * /quantum/backends:
 *   get:
 *     summary: Get available IBM Quantum backends
 *     tags: [Quantum]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of backends
 */
router.get('/backends', authMiddleware, quantumController.getBackends);

module.exports = router;
