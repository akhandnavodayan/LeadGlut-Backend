import { Router } from 'express';
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { huntAndSendLead } from '../controllers/lead.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { ScraperService } from '../services/scraper.service.js';
import whatsappService from '../services/whatsapp.service.js';
import { executeTransaction } from '../utils/transaction.js';

interface WalletRow extends RowDataPacket {
  balance: number;
}

const leadRouter = Router();

/**
 * @openapi
 * /api/lead/hunt:
 *   post:
 *     summary: Hunt and send a B2B lead
 *     description: Scrapes a lead, deducts one wallet credit, and sends the lead to WhatsApp.
 *     tags:
 *       - Leads
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - niche
 *               - location
 *               - whatsappNumber
 *             properties:
 *               niche:
 *                 type: string
 *                 example: Gym
 *               location:
 *                 type: string
 *                 example: Azamgarh
 *               whatsappNumber:
 *                 type: string
 *                 description: Destination number including country code.
 *                 example: '919876543210'
 *     responses:
 *       '200':
 *         description: Lead sent successfully via WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - lead
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lead sent successfully via WhatsApp.
 *                 lead:
 *                   $ref: '#/components/schemas/Lead'
 *       '400':
 *         description: Invalid request or insufficient wallet balance.
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
 *       '404':
 *         description: No leads found for the search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Scraper, WhatsApp, or internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
leadRouter.post('/hunt', authMiddleware, huntAndSendLead);

/**
 * @openapi
 * /api/leads/test-hunt:
 *   get:
 *     summary: Run the local lead-hunt test flow
 *     description: Unauthenticated test endpoint using test_user_123, Gym, and Azamgarh.
 *     tags:
 *       - Leads
 *     responses:
 *       '200':
 *         description: Test lead scraped and sent via WhatsApp.
 *       '400':
 *         description: Test wallet is missing or has insufficient balance.
 *       '500':
 *         description: Test configuration or integration failure.
 */
leadRouter.get('/test-hunt', async (_req: Request, res: Response): Promise<void> => {
  const whatsappNumber = process.env.TEST_WHATSAPP_NUMBER;

  if (!whatsappNumber) {
    res.status(500).json({
      error: 'Test WhatsApp number is not configured. Set TEST_WHATSAPP_NUMBER.',
    });
    return;
  }

  try {
    const leads = await new ScraperService().fetchLeads('Gym', 'Azamgarh');
    const lead = leads[0];

    if (!lead) {
      res.status(404).json({ error: 'No leads found for Gym in Azamgarh.' });
      return;
    }

    await executeTransaction(async (connection) => {
      const [rows] = await connection.query<WalletRow[]>(
        'SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE',
        ['test_user_123']
      );
      const wallet = rows[0];

      if (!wallet) {
        throw new Error('Test wallet not found.');
      }

      if (Number(wallet.balance) < 1) {
        throw new Error('Insufficient test wallet balance.');
      }

      await connection.query('UPDATE wallets SET balance = balance - 1 WHERE user_id = ?', [
        'test_user_123',
      ]);
    });

    const message = [
      'Hello,',
      '',
      'Here is your test B2B lead for gyms in Azamgarh:',
      '',
      `Business Name: ${lead.businessName}`,
      `Phone: ${lead.phone}`,
      `Address: ${lead.address}`,
      `Website: ${lead.website}`,
      '',
      'LeadGlut AI',
    ].join('\n');

    await whatsappService.sendMessage(whatsappNumber, message);

    res.status(200).json({
      success: true,
      message: 'Test lead scraped, charged, and sent via WhatsApp.',
      lead,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Test hunt failed.';
    const isClientError =
      message === 'Test wallet not found.' || message === 'Insufficient test wallet balance.';

    if (!isClientError) {
      console.error('Test lead hunt failed:', error);
    }

    res.status(isClientError ? 400 : 500).json({
      error: isClientError ? message : 'Test hunt failed.',
    });
  }
});

export default leadRouter;
