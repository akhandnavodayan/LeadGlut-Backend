import { Router } from 'express';
import { deductLeadBalance } from '../controllers/wallet.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const walletRouter = Router();

/**
 * @openapi
 * /api/wallet/deduct:
 *   post:
 *     summary: Deduct one lead credit
 *     description: Atomically deducts one credit from the authenticated user's wallet.
 *     tags:
 *       - Wallet
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: user_2abc123
 *     responses:
 *       '200':
 *         description: Credit deducted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lead deducted successfully.
 *       '400':
 *         description: Wallet not found or insufficient balance.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: Missing or invalid Clerk bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
walletRouter.post('/deduct', authMiddleware, deductLeadBalance);

export default walletRouter;
