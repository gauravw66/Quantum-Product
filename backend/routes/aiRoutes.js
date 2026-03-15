const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Quantum code generation via AI
 */

/**
 * @swagger
 * /api/ai/generate-circuit:
 *   post:
 *     summary: Generate Qiskit code from natural language
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated code
 */
router.post('/generate-circuit', authMiddleware, aiController.generateCircuit);

module.exports = router;
