const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Prebuilt quantum circuit modules
 */

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Get all available quantum modules
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: List of modules
 */
router.get('/', moduleController.getModules);

/**
 * @swagger
 * /api/modules/seed:
 *   post:
 *     summary: Seed the database with sample modules
 *     tags: [Modules]
 *     responses:
 *       200:
 *         description: Seeded successfully
 */
router.post('/seed', moduleController.seedModules);

module.exports = router;
