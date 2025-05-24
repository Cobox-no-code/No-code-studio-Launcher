import { Request, Response } from "express";
import { db } from "./../lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  CreateBankAccountDTO,
  UpdateBankAccountDTO,
} from "../models/banking/banking.model";

// GET /accounts
export const getAllBankAccounts = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    if (!firmId) {
      return res
        .status(400)
        .json({ success: false, error: "Firm ID is missing from headers." });
    }

    const isActive = req.query.isActive;
    let query = db("bank_accounts").where("firmId", firmId);

    if (isActive !== undefined) {
      query = query.where("isActive", isActive === "true" ? 1 : 0);
    }

    const accounts = await query.select();

    const formatted = accounts.map((account) => ({
      ...account,
      printUpiQrOnInvoices: Boolean(account.printUpiQrOnInvoices),
      printBankDetailsOnInvoices: Boolean(account.printBankDetailsOnInvoices),
      isActive: Boolean(account.isActive),
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /accounts
export const createBankAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    if (!firmId) {
      return res
        .status(400)
        .json({ success: false, error: "Firm ID is missing from headers." });
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

    await db("bank_accounts").insert(account);

    const formatted = {
      ...account,
      printUpiQrOnInvoices: Boolean(account.printUpiQrOnInvoices),
      printBankDetailsOnInvoices: Boolean(account.printBankDetailsOnInvoices),
      isActive: Boolean(account.isActive),
    };

    res.status(201).json(formatted);
  } catch (error: any) {
    console.error("Error creating bank account:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /accounts/:id
export const getBankAccountById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    const { id } = req.params;

    if (!firmId) {
      return res
        .status(400)
        .json({ success: false, error: "Firm ID is missing from headers." });
    }

    const account = await db("bank_accounts")
      .where("id", id)
      .where("firmId", firmId)
      .first();

    if (!account) {
      return res
        .status(404)
        .json({ success: false, error: "Bank account not found" });
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
export const updateBankAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    const { id } = req.params;

    if (!firmId) {
      return res
        .status(400)
        .json({ success: false, error: "Firm ID is missing from headers." });
    }

    const body: UpdateBankAccountDTO = req.body;

    const existing = await db("bank_accounts")
      .where("id", id)
      .where("firmId", firmId)
      .first();

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: "Bank account not found" });
    }

    const now = new Date().toISOString();
    const updateData = {
      ...body,
      printUpiQrOnInvoices:
        body.printUpiQrOnInvoices !== undefined
          ? body.printUpiQrOnInvoices
            ? 1
            : 0
          : undefined,
      printBankDetailsOnInvoices:
        body.printBankDetailsOnInvoices !== undefined
          ? body.printBankDetailsOnInvoices
            ? 1
            : 0
          : undefined,
      isActive:
        body.isActive !== undefined ? (body.isActive ? 1 : 0) : undefined,
      updatedAt: now,
    };

    // Remove undefined values from updateData
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await db("bank_accounts")
      .where("id", id)
      .where("firmId", firmId)
      .update(updateData);

    const updated = await db("bank_accounts")
      .where("id", id)
      .where("firmId", firmId)
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
export const deleteBankAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    const { id } = req.params;

    // DETAILED LOGGING - Add this to see what's happening
    console.log("=== DELETE BANK ACCOUNT DEBUG ===");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Params ID:", id);
    console.log("Firm ID from headers:", firmId);
    console.log("All headers:", req.headers);
    console.log("================================");

    if (!firmId) {
      console.log("❌ MISSING FIRM ID - Returning 400");
      return res
        .status(400)
        .json({ success: false, error: "Firm ID is missing from headers." });
    }

    if (!id) {
      console.log("❌ MISSING ACCOUNT ID - Returning 400");
      return res
        .status(400)
        .json({ success: false, error: "Account ID is missing from URL." });
    }

    // Start transaction to ensure data consistency
    await db.exec("BEGIN TRANSACTION");

    try {
      // Check if account exists first - WITH DETAILED LOGGING
      console.log(
        `🔍 Looking for account with ID: ${id} and firmId: ${firmId}`
      );

      const existingAccount = await db("bank_accounts")
        .where("id", id)
        .where("firmId", firmId)
        .first();

      console.log("🔍 Account found:", existingAccount ? "YES" : "NO");
      if (existingAccount) {
        console.log("📄 Account details:", {
          id: existingAccount.id,
          displayName: existingAccount.displayName,
          firmId: existingAccount.firmId,
        });
      }

      if (!existingAccount) {
        await db.exec("ROLLBACK");
        console.log("❌ Account not found - Rolling back");
        return res
          .status(404)
          .json({ success: false, error: "Bank account not found" });
      }

      // Get all transactions for this account
      console.log(
        `🔍 Looking for transactions with bankAccountId: ${id} and firmId: ${firmId}`
      );

      const existingTransactions = await db("bank_transactions")
        .where("bankAccountId", id)
        .where("firmId", firmId)
        .select();

      const transactionsToDelete = existingTransactions.length;
      console.log(`📊 Found ${transactionsToDelete} transactions to delete`);

      // First, delete all associated transactions
      if (transactionsToDelete > 0) {
        console.log(`🗑️ Deleting ${transactionsToDelete} transactions...`);

        const deletedTransactions = await db("bank_transactions")
          .where("bankAccountId", id)
          .where("firmId", firmId)
          .delete();

        console.log(`✅ Deleted ${deletedTransactions} transactions`);
      }

      // Then delete the bank account
      console.log(
        `🗑️ Deleting bank account with ID: ${id} and firmId: ${firmId}...`
      );

      const deleted = await db("bank_accounts")
        .where("id", id)
        .where("firmId", firmId)
        .delete();

      console.log(`✅ Deleted ${deleted} bank account(s)`);

      if (deleted === 0) {
        await db.exec("ROLLBACK");
        console.log("❌ No accounts were deleted - Rolling back");
        return res
          .status(404)
          .json({ success: false, error: "Bank account not found" });
      }

      // Commit the transaction
      await db.exec("COMMIT");
      console.log("✅ Transaction committed successfully");

      res.json({
        success: true,
        message: `Bank account deleted successfully along with ${transactionsToDelete} associated transaction(s)`,
        deletedTransactions: transactionsToDelete,
      });
    } catch (innerError) {
      await db.exec("ROLLBACK");
      console.log("❌ Inner error occurred - Rolling back:", innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error(`❌ Error deleting bank account ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
