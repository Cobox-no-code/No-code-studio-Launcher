import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from './../lib/db';
import { Payment, PaymentDirection, CreatePaymentDTO, UpdatePaymentDTO } from '../models/payment/payment.model';

// GET /payments
export const getAllPayments = async (req: Request, res: Response):Promise<any> => {
  const firmId = req.headers['x-firm-id'] as string;
  if (!firmId) return res.status(400).json({ error: 'Firm ID is required' });

  try {
    const { direction, partyId, startDate, endDate, paymentType } = req.query;
    let sql = `SELECT * FROM payments WHERE firmId = ?`;
    const params: any[] = [firmId];

    if (direction) { sql += ` AND direction = ?`; params.push(direction); }
    if (partyId) { sql += ` AND partyId = ?`; params.push(partyId); }
    if (startDate) { sql += ` AND paymentDate >= ?`; params.push(startDate); }
    if (endDate) { sql += ` AND paymentDate <= ?`; params.push(endDate); }
    if (paymentType) { sql += ` AND paymentType = ?`; params.push(paymentType); }

    sql += ` ORDER BY paymentDate DESC, createdAt DESC`;
    const payments = await db.raw(sql, params);

    res.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /payments
export const createPayment = async (req: Request, res: Response):Promise<any> => {
  const firmId = req.headers['x-firm-id'] as string;
  if (!firmId) return res.status(400).json({ error: 'Firm ID is required' });

  try {
    const data: CreatePaymentDTO = req.body;
    const now = new Date().toISOString();

    // Validation
    if (!data.amount || data.amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
    if (!data.paymentType || !data.paymentDate || !data.direction) return res.status(400).json({ error: 'Missing required fields' });
    if (data.paymentType === 'bank' && !data.bankAccountId) return res.status(400).json({ error: 'Bank account ID is required for bank payments' });
    if (data.paymentType === 'cheque' && (!data.chequeNumber || !data.chequeDate)) return res.status(400).json({ error: 'Cheque details are required for cheque payments' });

    const payment: Payment = {
      id: uuidv4(),
      firmId,
      ...data,
      isReconciled: false,
      createdAt: now,
      updatedAt: now,
    };

    await db('payments').insert(payment);

    // Bank balance update
    if (payment.paymentType === 'bank' && payment.bankAccountId) {
      const method = payment.direction === PaymentDirection.IN ? 'increment' : 'decrement';
      await db('bank_accounts')
        .where('id', payment.bankAccountId)
        [method]('currentBalance', payment.amount);
    }

    // Party balance update
    if (payment.partyId) {
      const party = await db('parties').where('id', payment.partyId).first();
      if (party) {
        let balance = party.openingBalance || 0;

        if (payment.direction === PaymentDirection.IN) {
          balance = party.openingBalanceType === 'to_receive'
            ? Math.max(0, balance - payment.amount)
            : balance + payment.amount;
        } else {
          balance = party.openingBalanceType === 'to_pay'
            ? Math.max(0, balance - payment.amount)
            : balance + payment.amount;
        }

        await db('parties')
          .where('id', payment.partyId)
          .update({ openingBalance: balance, updatedAt: now });
      }
    }

    res.status(201).json(payment);
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /payments/:id
export const getPaymentById = async (req: Request, res: Response):Promise<any> => {
  const firmId = req.headers['x-firm-id'] as string;
  const { id } = req.params;

  try {
    const payment = await db('payments')
    .where("id",id)
    .where("firmId",firmId).first();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /payments/:id
export const updatePayment = async (req: Request, res: Response):Promise<any> => {
  const firmId = req.headers['x-firm-id'] as string;
  const { id } = req.params;
  const data: UpdatePaymentDTO = req.body;
  const now = new Date().toISOString();

  try {
    const old = await db('payments') .where("id",id)
    .where("firmId",firmId).first();
    if (!old) return res.status(404).json({ error: 'Payment not found' });

    const amountDiff = (data.amount ?? old.amount) - old.amount;
    const updated = { ...old, ...data, updatedAt: now };

    await db('payments') .where("id",id)
    .where("firmId",firmId).update(updated);

    // Bank account balance update
    if (amountDiff !== 0 && old.paymentType === 'bank' && old.bankAccountId) {
      const method = old.direction === PaymentDirection.IN ? 'increment' : 'decrement';
      await db('bank_accounts')
        .where('id', old.bankAccountId)
        [method]('currentBalance', amountDiff);
    }

    // Party balance update
    if (amountDiff !== 0 && old.partyId) {
      const party = await db('parties').where('id', old.partyId).first();
      if (party) {
        let balance = party.openingBalance || 0;
        if (old.direction === PaymentDirection.IN) {
          balance = party.openingBalanceType === 'to_receive'
            ? Math.max(0, balance - amountDiff)
            : balance + amountDiff;
        } else {
          balance = party.openingBalanceType === 'to_pay'
            ? Math.max(0, balance - amountDiff)
            : balance + amountDiff;
        }

        await db('parties').where('id', old.partyId).update({ openingBalance: balance, updatedAt: now });
      }
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /payments/:id
export const deletePayment = async (req: Request, res: Response):Promise<any> => {
  const firmId = req.headers['x-firm-id'] as string;
  const { id } = req.params;

  try {
    const payment = await db('payments') .where("id",id)
    .where("firmId",firmId).first();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await db('payments') .where("id",id)
    .where("firmId",firmId).delete();

    // Reverse bank effect
    if (payment.paymentType === 'bank' && payment.bankAccountId) {
      const method = payment.direction === PaymentDirection.IN ? 'decrement' : 'increment';
      await db('bank_accounts')
        .where('id', payment.bankAccountId)
        [method]('currentBalance', payment.amount);
    }

    // Reverse party balance
    if (payment.partyId) {
      const party = await db('parties').where('id', payment.partyId).first();
      if (party) {
        let balance = party.openingBalance || 0;
        if (payment.direction === PaymentDirection.IN) {
          balance = party.openingBalanceType === 'to_receive'
            ? balance + payment.amount
            : Math.max(0, balance - payment.amount);
        } else {
          balance = party.openingBalanceType === 'to_pay'
            ? balance + payment.amount
            : Math.max(0, balance - payment.amount);
        }

        await db('parties')
          .where('id', payment.partyId)
          .update({ openingBalance: balance, updatedAt: new Date().toISOString() });
      }
    }

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: error.message });
  }
};
