const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Quantum job management
 */

/**
 * @swagger
 * /api/jobs/run:
 *   post:
 *     summary: Run a quantum circuit
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobName:
 *                 type: string
 *               code:
 *                 type: string
 *               backend:
 *                 type: string
 *               moduleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job created
 */
router.post('/run', authMiddleware, jobController.runJob);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs for the user
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get('/', authMiddleware, jobController.getJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Jobs]
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
 *         description: Job details
 */
router.get('/:id', authMiddleware, jobController.getJobById);
router.get('/:id/raw-info', authMiddleware, jobController.getRawInfo);
router.get('/:id/raw-results', authMiddleware, jobController.getRawResults);

module.exports = router;
