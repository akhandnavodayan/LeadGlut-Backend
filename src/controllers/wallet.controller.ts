import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { executeTransaction } from '../utils/transaction.js';

interface WalletRow extends RowDataPacket {
  balance: number;
}

export async function deductLeadBalance(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.body?.userId;

  const isValidUserId =
    (typeof userId === 'string' && userId.trim().length > 0) ||
    (typeof userId === 'number' && Number.isFinite(userId));

  if (!isValidUserId) {
    res.status(400).json({ error: 'A valid userId is required.' });
    return;
  }

  try {
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

      await connection.query(
        'UPDATE wallets SET balance = balance - 1 WHERE user_id = ?',
        [userId]
      );
    });

    res.status(200).json({ message: 'Lead deducted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction failed.';
    const isClientError =
      message === 'Insufficient wallet balance.' || message === 'Wallet not found.';

    if (!isClientError) {
      console.error('Wallet deduction failed:', error);
    }

    res
      .status(isClientError ? 400 : 500)
      .json({ error: isClientError ? message : 'Unable to deduct lead balance.' });
  }
}
