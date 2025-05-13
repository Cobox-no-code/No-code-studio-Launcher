import { Request, Response } from 'express';
import { db } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { BankTransactionType, CreateBankTransactionDTO } from '../models/banking/banking.model';

// GET /transactions
export const getAllBankTransactions = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    if (!firmId) return res.status(400).json({ success: false, error: 'Missing firmId in headers' });

    const { bankAccountId, transactionType, startDate, endDate } = req.query;


    let query = db("bank_transactions").where("firmId", firmId);

    // Apply filters if provided
    if (bankAccountId) {
      query = query.where("bankAccountId", bankAccountId);
    }

    if (transactionType) {
      query = query.where("transactionType", transactionType);
    }

    if (startDate) {
      query = db("bank_transactions").where("firmId", firmId).whereOp("transactionDate", ">=", startDate);
    }
    if (endDate) {
      query = db("bank_transactions").where("firmId", firmId).whereOp("transactionDate", "<=", endDate);
    }

    const transactions = await query.select();
    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /transactions
export const createBankTransaction = async (req: Request, res: Response):Promise<any> => {

  try {
    const firmId = req.headers['x-firm-id'] as string;
    if (!firmId) return res.status(400).json({ success: false, error: 'Missing firmId in headers' });

    const body: CreateBankTransactionDTO = req.body;
    const now = new Date().toISOString();

  // Begin transaction (SQL transaction, not bank transaction)
  await db.exec('BEGIN TRANSACTION');

  // Check if bank account exists
  const bankAccount = await db("bank_accounts")
    .where("id", body.bankAccountId)
    .where("firmId", firmId)
    .first();


    if (!bankAccount) {
        await db.exec('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }

    const transactionData = {
      id: uuidv4(),
      ...body,
      firmId,
      createdAt: now,
      updatedAt: now,
    };

    await db("bank_transactions").insert(transactionData);

    // Update account balance based on transaction type
    let balanceChange = body.amount;

    if (
      body.transactionType === BankTransactionType.WITHDRAWAL ||
      body.transactionType === BankTransactionType.TRANSFER ||
      body.transactionType === BankTransactionType.CHARGE
    ) {
      balanceChange = -balanceChange;
    }

    const newBalance = bankAccount.currentBalance + balanceChange;

    await db("bank_accounts")
    .where("id", body.bankAccountId)
    .where("firmId", firmId)
    .update({
      currentBalance: newBalance,
      updatedAt: now
    });

  // Commit transaction
  await db.exec('COMMIT');

    res.status(201).json(transactionData);
  } catch (error: any) {
    await db.exec('ROLLBACK');
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /transactions/:id
export const getBankTransactionById = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    const { id } = req.params;

    const transaction = await db('bank_transactions', firmId).where('id', id).first();
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error: any) {
    console.error(`Error fetching transaction ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /transactions/:id
export const updateBankTransaction = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    const { id } = req.params;
    const updates = req.body;

    const existing = await db('bank_transactions', firmId).where('id', id).first();
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    await db('bank_transactions', firmId).where('id', id).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating transaction ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /transactions/:id
export const deleteBankTransaction = async (req: Request, res: Response):Promise<any> => {

  try {
    const firmId = req.headers['x-firm-id'] as string;
    const { id } = req.params;
    await db.exec("BEGIN TRANSACTION");

    const transaction = await db("bank_transactions", firmId).where("id", id).first();
    if (!transaction) {
      await db.exec("ROLLBACK");
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }
    

    const bankAccount = await db("bank_accounts", firmId).where("id", transaction.bankAccountId).first();

    if (!bankAccount) {
        await db.exec("ROLLBACK");
      return res.status(404).json({ success: false, error: 'Associated bank account not found' });
    }

    let balanceAdjustment = transaction.amount;
    if (
      transaction.transactionType === BankTransactionType.WITHDRAWAL ||
      transaction.transactionType === BankTransactionType.TRANSFER ||
      transaction.transactionType === BankTransactionType.CHARGE
    ) {
      balanceAdjustment = -balanceAdjustment;
    }

    const newBalance = bankAccount.currentBalance - balanceAdjustment;

    await db("bank_accounts", firmId)
      .where("id", transaction.bankAccountId)
      .update({
        currentBalance: newBalance,
        updatedAt: new Date().toISOString()
      });

    await db("bank_transactions", firmId).where("id", id).delete();

    await db.exec("COMMIT");

    res.json({ success: true });
  } catch (error: any) {
    await db.exec("ROLLBACK");
    console.error(`Error deleting transaction ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
