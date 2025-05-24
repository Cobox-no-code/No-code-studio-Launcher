import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  CreatePaymentDTO,
  Payment,
  PaymentDirection,
  UpdatePaymentDTO,
} from "../models/payment/payment.model";
import { db } from "./../lib/db";

// GET /payments
export const getAllPayments = async (
  req: Request,
  res: Response
): Promise<any> => {
  const firmId = req.headers["x-firm-id"] as string;
  if (!firmId) return res.status(400).json({ error: "Firm ID is required" });

  try {
    const { direction, partyId, startDate, endDate, paymentType } = req.query;
    let sql = `SELECT * FROM payments WHERE firmId = ?`;
    const params: any[] = [firmId];

    if (direction) {
      sql += ` AND direction = ?`;
      params.push(direction);
    }
    if (partyId) {
      sql += ` AND partyId = ?`;
      params.push(partyId);
    }
    if (startDate) {
      sql += ` AND paymentDate >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND paymentDate <= ?`;
      params.push(endDate);
    }
    if (paymentType) {
      sql += ` AND paymentType = ?`;
      params.push(paymentType);
    }

    sql += ` ORDER BY paymentDate DESC, createdAt DESC`;
    const payments = await db.raw(sql, params);

    res.json(payments);
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /payments/:id
export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const firmId = req.headers["x-firm-id"] as string;
  const { id } = req.params;

  try {
    const payment = await db("payments")
      .where("id", id)
      .where("firmId", firmId)
      .first();
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /payments
export const createPayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  const firmId = req.headers["x-firm-id"] as string;
  if (!firmId) return res.status(400).json({ error: "Firm ID is required" });

  try {
    const data: CreatePaymentDTO = req.body;
    const now = new Date().toISOString();

    if (!data.amount || data.amount <= 0)
      return res
        .status(400)
        .json({ error: "Amount must be greater than zero" });

    if (!data.paymentType || !data.paymentDate || !data.direction)
      return res.status(400).json({ error: "Missing required fields" });

    if (data.paymentType === "bank" && !data.bankAccountId)
      return res
        .status(400)
        .json({ error: "Bank account ID is required for bank payments" });

    if (
      data.paymentType === "cheque" &&
      (!data.chequeNumber || !data.chequeDate)
    )
      return res
        .status(400)
        .json({ error: "Cheque details are required for cheque payments" });

    if (data.paymentType === "bank" && data.bankAccountId) {
      const bank = await db("bank_accounts")
        .where("id", data.bankAccountId)
        .first();
      if (!bank)
        return res.status(400).json({ error: "Bank account not found" });

      const currentBalance = bank.currentBalance || 0;
      const newBalance =
        data.direction === PaymentDirection.IN
          ? currentBalance + data.amount
          : currentBalance - data.amount;

      await db("bank_accounts").where("id", data.bankAccountId).update({
        currentBalance: newBalance,
        updatedAt: now,
      });
    }

    const payment: Payment = {
      id: uuidv4(),
      firmId,
      ...data,
      isReconciled: false,
      createdAt: now,
      updatedAt: now,
    };

    await db("payments").insert(payment);
    // 3. Update party balance if applicable
    if (payment.partyId) {
      const party = await db("parties").where("id", payment.partyId).first();
      if (party) {
        let balance = party.currentBalance || 0;

        if (payment.direction === PaymentDirection.IN) {
          if (party.currentBalanceType === "to_receive") {
            if (balance - payment.amount < 0) {
              const surplus = payment.amount - balance;
              balance = surplus;
              await db("parties").where("id", payment.partyId).update({
                currentBalance: balance,
                currentBalanceType: "to_pay",
                updatedAt: now,
              });
            } else {
              balance -= payment.amount;
              await db("parties").where("id", payment.partyId).update({
                currentBalance: balance,
                updatedAt: now,
              });
            }
          } else {
            balance += payment.amount;
            await db("parties").where("id", payment.partyId).update({
              currentBalance: balance,
              updatedAt: now,
            });
          }
        } else if (payment.direction === PaymentDirection.OUT) {
          if (party.currentBalanceType === "to_pay") {
            if (balance - payment.amount < 0) {
              const surplus = payment.amount - balance;
              balance = surplus;
              await db("parties").where("id", payment.partyId).update({
                currentBalance: balance,
                currentBalanceType: "to_receive",
                updatedAt: now,
              });
            } else {
              balance -= payment.amount;
              await db("parties").where("id", payment.partyId).update({
                currentBalance: balance,
                updatedAt: now,
              });
            }
          } else {
            balance += payment.amount;
            await db("parties").where("id", payment.partyId).update({
              currentBalance: balance,
              updatedAt: now,
            });
          }
        }
      }
    }

    res.status(201).json(payment);
  } catch (error: any) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /payments/:id
export const updatePayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  const firmId = req.headers["x-firm-id"] as string;
  const paymentId = req.params.id;
  if (!firmId) return res.status(400).json({ error: "Firm ID is required" });

  try {
    const existing = await db("payments")
      .where("id", paymentId)
      .where("firmId", firmId)
      .first();
    if (!existing) return res.status(404).json({ error: "Payment not found" });

    const data: UpdatePaymentDTO = req.body;
    const now = new Date().toISOString();

    // Revert old bank balance
    if (existing.paymentType === "bank" && existing.bankAccountId) {
      const oldBank = await db("bank_accounts")
        .where("id", existing.bankAccountId)
        .first();
      if (oldBank) {
        const revertAmount = existing.amount;
        const balanceChange =
          existing.direction === PaymentDirection.IN
            ? -revertAmount
            : revertAmount;
        await db("bank_accounts")
          .where("id", oldBank.id)
          .update({
            currentBalance: oldBank.currentBalance + balanceChange,
          });
      }
    }

    const updatedPayment: Payment = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    if (updatedPayment.paymentType === "bank" && updatedPayment.bankAccountId) {
      const newBank = await db("bank_accounts")
        .where("id", updatedPayment.bankAccountId)
        .first();
      if (!newBank)
        return res.status(400).json({ error: "Invalid bank account" });

      const balanceChange =
        updatedPayment.direction === PaymentDirection.IN
          ? updatedPayment.amount
          : -updatedPayment.amount;

      await db("bank_accounts")
        .where("id", newBank.id)
        .update({
          currentBalance: newBank.currentBalance + balanceChange,
        });
    }

    await db("payments")
      .where("id", paymentId)
      .where("firmId", firmId)
      .update(updatedPayment);

    res.status(200).json(updatedPayment);
  } catch (error: any) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /payments/:id
export const deletePayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  const firmId = req.headers["x-firm-id"] as string;
  const { id } = req.params;

  try {
    const payment = await db("payments")
      .where("id", id)
      .where("firmId", firmId)
      .first();
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const now = new Date().toISOString();

    // Revert bank balance
    if (payment.paymentType === "bank" && payment.bankAccountId) {
      const bank = await db("bank_accounts")
        .where("id", payment.bankAccountId)
        .first();
      if (bank) {
        const balanceChange =
          payment.direction === PaymentDirection.IN
            ? -payment.amount
            : payment.amount;
        await db("bank_accounts")
          .where("id", bank.id)
          .update({
            currentBalance: bank.currentBalance + balanceChange,
          });
      }
    }

    // Revert party balance
    if (payment.partyId) {
      const party = await db("parties").where("id", payment.partyId).first();
      if (party) {
        let balance = party.currentBalance || 0;
        if (payment.direction === PaymentDirection.IN) {
          if (party.currentBalanceType === "to_receive") {
            balance += payment.amount;
          } else {
            balance -= payment.amount;
          }
        } else {
          if (party.currentBalanceType === "to_pay") {
            balance += payment.amount;
          } else {
            balance -= payment.amount;
          }
        }

        await db("parties")
          .where("id", party.id)
          .update({
            currentBalance: Math.abs(balance),
            updatedAt: now,
          });
      }
    }

    await db("payments").where("id", id).where("firmId", firmId).delete();
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: error.message });
  }
};
