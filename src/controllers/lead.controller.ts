import type { Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ScraperService } from '../services/scraper.service.js';
import whatsappService from '../services/whatsapp.service.js';
import { executeTransaction } from '../utils/transaction.js';

interface WalletRow extends RowDataPacket {
  balance: number;
}

export async function huntAndSendLead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { niche, location, whatsappNumber } = req.body ?? {};
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (typeof niche !== 'string' || !niche.trim()) {
    res.status(400).json({ error: 'A valid niche is required.' });
    return;
  }

  if (typeof location !== 'string' || !location.trim()) {
    res.status(400).json({ error: 'A valid location is required.' });
    return;
  }

  if (typeof whatsappNumber !== 'string' || !whatsappNumber.trim()) {
    res.status(400).json({ error: 'A valid whatsappNumber is required.' });
    return;
  }

  try {
    const scraperService = new ScraperService();
    const leads = await scraperService.fetchLeads(niche.trim(), location.trim());

    const lead = leads[0];
    if (!lead) {
      res.status(404).json({ error: 'No leads found for the provided criteria.' });
      return;
    }

    await executeTransaction(async (connection) => {
      const [rows] = await connection.query<WalletRow[]>(
        'SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE',
        [userId]
      );

      const wallet = rows[0];

      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      if (Number(wallet.balance) < 1) {
        throw new Error('Insufficient wallet balance.');
      }

      await connection.query('UPDATE wallets SET balance = balance - 1 WHERE user_id = ?', [
        userId,
      ]);
    });

    const message = [
      'Hello,',
      '',
      `This is a curated B2B lead match for ${niche.trim()} in ${location.trim()}.`,
      '',
      `Business Name: ${lead.businessName}`,
      `Phone: ${lead.phone}`,
      `Address: ${lead.address}`,
      `Website: ${lead.website}`,
      '',
      'Best regards,',
      'LeadGlut AI',
    ].join('\n');

    await whatsappService.sendMessage(whatsappNumber, message);

    res.status(200).json({
      success: true,
      message: 'Lead sent successfully via WhatsApp.',
      lead,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process lead request.';
    const statusCode =
      message === 'Wallet not found.' || message === 'Insufficient wallet balance.' ? 400 : 500;

    if (statusCode === 500) {
      console.error('Lead hunting failed:', error);
    }

    res.status(statusCode).json({
      error: statusCode === 400 ? message : 'Unable to process lead request.',
    });
  }
}
