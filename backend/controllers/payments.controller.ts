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
// POST /payments
export const createPayment = async (req: Request, res: Response): Promise<any> => {
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
          if (party.openingBalanceType === 'to_receive') {
            if (balance - payment.amount < 0) {
              const surplus = payment.amount - balance;
              balance = surplus;
              await db('parties')
                .where('id', payment.partyId)
                .update({
                  openingBalance: balance,
                  openingBalanceType: 'to_pay',
                  updatedAt: now,
                });
            } else {
              balance -= payment.amount;
              await db('parties')
                .where('id', payment.partyId)
                .update({
                  openingBalance: balance,
                  updatedAt: now,
                });
            }
          } else {
            // Already a to_pay, just increase it
            balance += payment.amount;
            await db('parties')
              .where('id', payment.partyId)
              .update({
                openingBalance: balance,
                updatedAt: now,
              });
          }
        }

        else if (payment.direction === PaymentDirection.OUT) {
          if (party.openingBalanceType === 'to_pay') {
            if (balance - payment.amount < 0) {
              const surplus = payment.amount - balance;
              balance = surplus;
              await db('parties')
                .where('id', payment.partyId)
                .update({
                  openingBalance: balance,
                  openingBalanceType: 'to_receive',
                  updatedAt: now,
                });
            } else {
              balance -= payment.amount;
              await db('parties')
                .where('id', payment.partyId)
                .update({
                  openingBalance: balance,
                  updatedAt: now,
                });
            }
          } else {
            // Already a to_receive, just increase it
            balance += payment.amount;
            await db('parties')
              .where('id', payment.partyId)
              .update({
                openingBalance: balance,
                updatedAt: now,
              });
          }
        }
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
// PUT /payments/:id
export const updatePayment = async (req: Request, res: Response): Promise<any> => {
  const firmId = req.headers['x-firm-id'] as string;
  const paymentId = req.params.id;

  if (!firmId) return res.status(400).json({ error: 'Firm ID is required' });

  try {
    const existing = await db('payments').where( "id", paymentId ).where("firmId",firmId).first();
    if (!existing) return res.status(404).json({ error: 'Payment not found' });

    const data: UpdatePaymentDTO = req.body;
    const now = new Date().toISOString();

    // 1. Revert bank balance
    if (existing.paymentType === 'bank' && existing.bankAccountId) {
      const revertBankMethod = existing.direction === PaymentDirection.IN ? 'decrement' : 'increment';
      await db('bank_accounts')
        .where('id', existing.bankAccountId)
        [revertBankMethod]('currentBalance', existing.amount);
    }

    // 2. Revert party balance
    if (existing.partyId) {
      const party = await db('parties').where('id', existing.partyId).first();
      if (party) {
        let balance = party.openingBalance || 0;

        if (existing.direction === PaymentDirection.IN) {
          if (party.openingBalanceType === 'to_receive') {
            balance += existing.amount;
          } else {
            balance -= existing.amount;
          }
        } else {
          if (party.openingBalanceType === 'to_pay') {
            balance += existing.amount;
          } else {
            balance -= existing.amount;
          }
        }

        await db('parties')
          .where('id', existing.partyId)
          .update({ openingBalance: Math.abs(balance), updatedAt: now });
      }
    }

    // 3. Update the payment record
    const updatedPayment: Payment = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    await db('payments').where( "id", paymentId ).where("firmId",firmId).update(updatedPayment);

    // 4. Apply new bank balance
    if (updatedPayment.paymentType === 'bank' && updatedPayment.bankAccountId) {
      const applyBankMethod = updatedPayment.direction === PaymentDirection.IN ? 'increment' : 'decrement';
      await db('bank_accounts')
        .where('id', updatedPayment.bankAccountId)
        [applyBankMethod]('currentBalance', updatedPayment.amount);
    }

    // 5. Apply new party balance
    if (updatedPayment.partyId) {
      const party = await db('parties').where('id', updatedPayment.partyId).first();
      if (party) {
        let balance = party.openingBalance || 0;

        if (updatedPayment.direction === PaymentDirection.IN) {
          if (party.openingBalanceType === 'to_receive') {
            if (balance - updatedPayment.amount < 0) {
              const surplus = updatedPayment.amount - balance;
              balance = surplus;
              await db('parties').where('id', party.id).update({
                openingBalance: balance,
                openingBalanceType: 'to_pay',
                updatedAt: now,
              });
            } else {
              balance -= updatedPayment.amount;
              await db('parties').where('id', party.id).update({
                openingBalance: balance,
                updatedAt: now,
              });
            }
          } else {
            balance += updatedPayment.amount;
            await db('parties').where('id', party.id).update({
              openingBalance: balance,
              updatedAt: now,
            });
          }
        }

        else if (updatedPayment.direction === PaymentDirection.OUT) {
          if (party.openingBalanceType === 'to_pay') {
            if (balance - updatedPayment.amount < 0) {
              const surplus = updatedPayment.amount - balance;
              balance = surplus;
              await db('parties').where('id', party.id).update({
                openingBalance: balance,
                openingBalanceType: 'to_receive',
                updatedAt: now,
              });
            } else {
              balance -= updatedPayment.amount;
              await db('parties').where('id', party.id).update({
                openingBalance: balance,
                updatedAt: now,
              });
            }
          } else {
            balance += updatedPayment.amount;
            await db('parties').where('id', party.id).update({
              openingBalance: balance,
              updatedAt: now,
            });
          }
        }
      }
    }

    res.status(200).json(updatedPayment);
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
