import { Request, Response } from 'express';
import { db } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { CreateBankAccountDTO, UpdateBankAccountDTO } from '../models/banking/banking.model';

// GET /accounts
export const getAllBankAccounts = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    if (!firmId) {
      return res.status(400).json({ success: false, error: 'Firm ID is missing from headers.' });
    }

    const isActive = req.query.isActive;
    let query = db('bank_accounts', firmId);

    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' ? 1 : 0);
    }

    const accounts = await query.select();

    const formatted = accounts.map(account => ({
      ...account,
      printUpiQrOnInvoices: Boolean(account.printUpiQrOnInvoices),
      printBankDetailsOnInvoices: Boolean(account.printBankDetailsOnInvoices),
      isActive: Boolean(account.isActive),
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /accounts
export const createBankAccount = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    if (!firmId) {
      return res.status(400).json({ success: false, error: 'Firm ID is missing from headers.' });
    }

    const body: CreateBankAccountDTO = req.body;
    const now = new Date().toISOString();

    const account = {
      id: uuidv4(),
      firmId,
      ...body,
      currentBalance: body.openingBalance,
      printUpiQrOnInvoices: body.printUpiQrOnInvoices ? 1 : 0,
      printBankDetailsOnInvoices: body.printBankDetailsOnInvoices ? 1 : 0,
      isActive: body.isActive ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    };

    await db('bank_accounts').insert(account);

    const formatted = {
      ...account,
      printUpiQrOnInvoices: Boolean(account.printUpiQrOnInvoices),
      printBankDetailsOnInvoices: Boolean(account.printBankDetailsOnInvoices),
      isActive: Boolean(account.isActive),
    };

    res.status(201).json(formatted);
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /accounts/:id
export const getBankAccountById = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    const { id } = req.params;

    if (!firmId) {
      return res.status(400).json({ success: false, error: 'Firm ID is missing from headers.' });
    }

    const account = await db('bank_accounts',firmId)
    .where("id",id)
    .first();

    if (!account) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }

    const formatted = {
      ...account,
      printUpiQrOnInvoices: Boolean(account.printUpiQrOnInvoices),
      printBankDetailsOnInvoices: Boolean(account.printBankDetailsOnInvoices),
      isActive: Boolean(account.isActive),
    };

    res.json(formatted);
  } catch (error: any) {
    console.error(`Error fetching bank account ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /accounts/:id
export const updateBankAccount = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    const { id } = req.params;

    if (!firmId) {
      return res.status(400).json({ success: false, error: 'Firm ID is missing from headers.' });
    }

    const body: UpdateBankAccountDTO = req.body;

    const existing = await db('bank_accounts',firmId).where("id",id)
   .first();
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }

    const now = new Date().toISOString();
    const updateData = {
      ...body,
      printUpiQrOnInvoices: body.printUpiQrOnInvoices !== undefined ? (body.printUpiQrOnInvoices ? 1 : 0) : undefined,
      printBankDetailsOnInvoices: body.printBankDetailsOnInvoices !== undefined ? (body.printBankDetailsOnInvoices ? 1 : 0) : undefined,
      isActive: body.isActive !== undefined ? (body.isActive ? 1 : 0) : undefined,
      updatedAt: now,
    };

    await db('bank_accounts',firmId).where("id",id)
    .update(updateData);

    const updated = await db('bank_accounts',firmId).where("id",id)
    .first();
    const formatted = {
      ...updated,
      printUpiQrOnInvoices: Boolean(updated.printUpiQrOnInvoices),
      printBankDetailsOnInvoices: Boolean(updated.printBankDetailsOnInvoices),
      isActive: Boolean(updated.isActive),
    };

    res.json(formatted);
  } catch (error: any) {
    console.error(`Error updating bank account ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /accounts/:id
export const deleteBankAccount = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string;
    const { id } = req.params;

    if (!firmId) {
      return res.status(400).json({ success: false, error: 'Firm ID is missing from headers.' });
    }

    const transactions = await db('bank_transactions')
    .where( "bankAccountId", id)
    .where("firmId",firmId).first();

    if (transactions) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete bank account with transactions. Try deactivating it instead.',
      });
    }

    const deleted = await db('bank_accounts').where("id",id)
    .where("firmId",firmId).delete();
    if (deleted === 0) {
      return res.status(404).json({ success: false, error: 'Bank account not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting bank account ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
