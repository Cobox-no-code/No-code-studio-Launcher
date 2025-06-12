// lib/db-helpers.ts
import { Document } from "../../models/document/document.model";
import { db } from "./../../lib/db";
import { v4 as uuidv4 } from "uuid";

/**
 * Safely inserts a document into the database
 */
export async function insertDocument(documentData: any, firmId: string) {
  const now = new Date().toISOString();
  const id = uuidv4();

  // Ensure required fields
  const dataToInsert: any = {
    id,
    firmId,
    documentType: documentData.documentType || "sale_invoice",
    documentNumber: documentData.documentNumber || "",
    documentDate: documentData.documentDate || now.split("T")[0],
    partyName: documentData.partyName || "",
    partyType: documentData.partyType || "customer",
    transactionType: documentData.transactionType || "cash",
    status: documentData.status || "draft",
    roundOff: documentData.roundOff || 0,
    total: documentData.total || 0,
    balanceAmount: documentData.balanceAmount || 0,
    paidAmount: documentData.paidAmount || 0,
    paymentType: documentData.paymentType || "cash",
    createdAt: now,
    updatedAt: now,
  };

  // Optional fields
  if (documentData.partyId) dataToInsert.partyId = documentData.partyId;
  if (documentData.phone) dataToInsert.phone = documentData.phone;
  if (documentData.billingAddress)
    dataToInsert.billingAddress = documentData.billingAddress;
  if (documentData.shippingAddress)
    dataToInsert.shippingAddress = documentData.shippingAddress;
  if (documentData.billingName)
    dataToInsert.billingName = documentData.billingName;
  if (documentData.ewaybill) dataToInsert.ewaybill = documentData.ewaybill;
  if (documentData.poNumber) dataToInsert.poNumber = documentData.poNumber;
  if (documentData.poDate) dataToInsert.poDate = documentData.poDate;
  if (documentData.stateOfSupply)
    dataToInsert.stateOfSupply = documentData.stateOfSupply;
  if (documentData.documentTime)
    dataToInsert.documentTime = documentData.documentTime;
  if (documentData.bankId) dataToInsert.bankId = documentData.bankId;
  if (documentData.chequeNumber)
    dataToInsert.chequeNumber = documentData.chequeNumber;
  if (documentData.chequeDate)
    dataToInsert.chequeDate = documentData.chequeDate;
  if (documentData.discountAmount)
    dataToInsert.discountAmount = documentData.discountAmount;
  if (documentData.discountPercentage)
    dataToInsert.discountPercentage = documentData.discountPercentage;
  if (documentData.taxAmount) dataToInsert.taxAmount = documentData.taxAmount;
  if (documentData.taxPercentage)
    dataToInsert.taxPercentage = documentData.taxPercentage;
  if (documentData.shipping) dataToInsert.shipping = documentData.shipping;
  if (documentData.packaging) dataToInsert.packaging = documentData.packaging;
  if (documentData.adjustment)
    dataToInsert.adjustment = documentData.adjustment;
  if (documentData.transportName)
    dataToInsert.transportName = documentData.transportName;
  if (documentData.vehicleNumber)
    dataToInsert.vehicleNumber = documentData.vehicleNumber;
  if (documentData.deliveryDate)
    dataToInsert.deliveryDate = documentData.deliveryDate;
  if (documentData.deliveryLocation)
    dataToInsert.deliveryLocation = documentData.deliveryLocation;
  if (documentData.description)
    dataToInsert.description = documentData.description;
  if (documentData.image) dataToInsert.image = documentData.image;

  // Create placeholders and values array for the SQL query
  const columns = Object.keys(dataToInsert).join(", ");
  const placeholders = Object.keys(dataToInsert)
    .map(() => "?")
    .join(", ");
  const values = Object.values(dataToInsert);

  // Insert using raw SQL to avoid issues with the query builder
  const insertSql = `INSERT INTO documents (${columns}) VALUES (${placeholders})`;
  await db.raw(insertSql, values);

  return id;
}

/**
 * Safely inserts document items
 */
export async function insertDocumentItems(
  items: any[],
  documentId: string,
  firmId: string
) {
  const now = new Date().toISOString();
  console.log(items);
  if (!items || items.length === 0) return;

  for (const item of items) {
    const itemId = uuidv4();

    // Prepare item data
    const itemData: any = {
      id: itemId,
      firmId,
      documentId,
      itemId: item.itemId || "",
      itemName: item.itemName || "",
      primaryQuantity: item.primaryQuantity || 0,
      primaryUnitId: item.primaryUnitId || "",
      primaryUnitName: item.primaryUnitName || "",
      pricePerUnit: item.pricePerUnit || 0,
      wholesalePrice: item.wholesalePrice,
      wholesaleQuantity: item.wholesaleQuantity,
      amount: item.amount || 0,
      createdAt: now,
      updatedAt: now,
    };

    // Optional fields
    if (item.hsnCode) itemData.hsnCode = item.hsnCode;
    if (item.secondaryQuantity)
      itemData.secondaryQuantity = item.secondaryQuantity;
    if (item.secondaryUnitId) itemData.secondaryUnitId = item.secondaryUnitId;
    if (item.secondaryUnitName)
      itemData.secondaryUnitName = item.secondaryUnitName;
    if (item.conversionRate) itemData.conversionRate = item.conversionRate;
    if (item.unit_conversionId)
      itemData.unit_conversionId = item.unit_conversionId;
    if (item.mfgDate) itemData.mfgDate = item.mfgDate;
    if (item.batchNo) itemData.batchNo = item.batchNo;
    if (item.expDate) itemData.expDate = item.expDate;
    if (item.serialNo) itemData.serialNo = item.serialNo;
    if (item.taxType) itemData.taxType = item.taxType;
    if (item.taxRate) itemData.taxRate = item.taxRate;
    if (item.taxAmount) itemData.taxAmount = item.taxAmount;
    if (item.discountPercent) itemData.discountPercent = item.discountPercent;
    if (item.discountAmount) itemData.discountAmount = item.discountAmount;

    // Create placeholders and values array
    const columns = Object.keys(itemData).join(", ");
    const placeholders = Object.keys(itemData)
      .map(() => "?")
      .join(", ");
    const values = Object.values(itemData);

    // Insert using raw SQL
    const insertSql = `INSERT INTO document_items (${columns}) VALUES (${placeholders})`;
    await db.raw(insertSql, values);
  }
}

/**
 * Safely inserts document charges
 */
export async function insertDocumentCharges(
  charges: any[],
  documentId: string,
  firmId: string
) {
  const now = new Date().toISOString();

  if (!charges || charges.length === 0) return;

  for (const charge of charges) {
    const chargeId = uuidv4();

    // Prepare charge data
    const chargeData = {
      id: chargeId,
      firmId,
      documentId,
      name: charge.name || "",
      amount: charge.amount || 0,
      createdAt: now,
      updatedAt: now,
    };

    // Create placeholders and values array
    const columns = Object.keys(chargeData).join(", ");
    const placeholders = Object.keys(chargeData)
      .map(() => "?")
      .join(", ");
    const values = Object.values(chargeData);

    // Insert using raw SQL
    const insertSql = `INSERT INTO document_charges (${columns}) VALUES (${placeholders})`;
    await db.raw(insertSql, values);
  }
}

/**
 * Safely inserts document transportation details
 */
export async function insertDocumentTransportation(
  transportation: any[],
  documentId: string,
  firmId: string
) {
  const now = new Date().toISOString();

  if (!transportation || transportation.length === 0) return;

  for (const transport of transportation) {
    const transportId = uuidv4();

    // Prepare transportation data
    const transportData: any = {
      id: transportId,
      firmId,
      documentId,
      type: transport.type || "",
      detail: transport.detail || "",
      createdAt: now,
      updatedAt: now,
    };

    // Optional fields
    if (transport.amount) transportData.amount = transport.amount;

    // Create placeholders and values array
    const columns = Object.keys(transportData).join(", ");
    const placeholders = Object.keys(transportData)
      .map(() => "?")
      .join(", ");
    const values = Object.values(transportData);

    // Insert using raw SQL
    const insertSql = `INSERT INTO document_transportation (${columns}) VALUES (${placeholders})`;
    await db.raw(insertSql, values);
  }
}

/**
 * Updates stock quantities for items based on the document type and unit conversions
 * Handles cases where only primary, only secondary, or both unit quantities are provided
 *
 * @param {string} documentType - Type of document affecting stock
 * @param {Array} items - Array of items with quantities to update
 * @param {string} firmId - ID of the firm
 * @param {boolean} reverse - Whether to reverse the stock operation (e.g. for cancellations)
 */
/**
/**
 * Updates stock quantities for items based on the document type and unit conversions
 * Handles cases where only primary, only secondary, or both unit quantities are provided
 * 
 * @param {string} documentType - Type of document affecting stock
 * @param {Array} items - Array of items with quantities to update
 * @param {string} firmId - ID of the firm
 * @param {boolean} reverse - Whether to reverse the stock operation (e.g. for cancellations)
 */
export async function updateStockQuantities(
  documentType: string,
  items: any[],
  firmId: string,
  reverse: boolean = false
) {
  const stockChangeTypes = [
    "purchase_invoice",
    "purchase_return",
    "sale",
    "sale_return",
    "sale_invoice",
    "delivery_challan",
  ];

  if (!stockChangeTypes.includes(documentType)) return;

  for (const item of items) {
    try {
      // Fetch current inventory stock
      const [inventoryItem] = await db.raw(
        `SELECT id, primaryQuantity, secondaryQuantity 
         FROM items 
         WHERE id = ? AND firmId = ?`,
        [item.itemId, firmId]
      );

      if (!inventoryItem) {
        console.log(`Item ${item.itemId} not found in inventory, skipping...`);
        continue;
      }

      let conversionRate = Number(item.conversionRate) || 0;
      const hasSecondaryUnit =
        !!item.secondaryUnitId &&
        !!item.unit_conversionId &&
        conversionRate > 0;

      let operator = "+";
      if (
        [
          "sale",
          "sale_invoice",
          "purchase_return",
          "delivery_challan",
        ].includes(documentType)
      ) {
        operator = "-";
      }
      if (reverse) {
        operator = operator === "+" ? "-" : "+";
      }

      // Quantities from input
      const primaryQtyChange = Number(item.primaryQuantity) || 0;
      const secondaryQtyChange = Number(item.secondaryQuantity) || 0;

      // Current stock
      const currentPrimaryQty = Number(inventoryItem.primaryQuantity) || 0;
      const currentSecondaryQty = Number(inventoryItem.secondaryQuantity) || 0;

      if (!hasSecondaryUnit) {
        // 🔹 Only primary unit management
        const newPrimaryQty =
          operator === "+"
            ? currentPrimaryQty + primaryQtyChange
            : currentPrimaryQty - primaryQtyChange; // Removed Math.max(0,...)

        console.log(`🟢 Only primary stock update for item ${item.itemId}:`, {
          currentPrimaryQty,
          change: `${operator}${primaryQtyChange}`,
          newPrimaryQty,
        });

        await db.raw(
          `UPDATE items SET 
            primaryQuantity = ? 
           WHERE id = ? AND firmId = ?`,
          [newPrimaryQty, item.itemId, firmId]
        );
      } else {
        // 🔸 Dual unit with conversion
        const currentTotalInSecondary =
          currentPrimaryQty * conversionRate + currentSecondaryQty;
        const changeInSecondary =
          primaryQtyChange * conversionRate + secondaryQtyChange;

        const newTotalInSecondary =
          operator === "+"
            ? currentTotalInSecondary + changeInSecondary
            : currentTotalInSecondary - changeInSecondary; // Removed Math.max(0,...)

        const newPrimaryQty = Math.floor(newTotalInSecondary / conversionRate);
        const newSecondaryQty = newTotalInSecondary % conversionRate;

        console.log(`🟡 Dual unit stock update for item ${item.itemId}:`, {
          currentTotalInSecondary,
          changeInSecondary: `${operator}${changeInSecondary}`,
          newTotalInSecondary,
          newPrimaryQty,
          newSecondaryQty,
        });

        await db.raw(
          `UPDATE items SET 
            primaryQuantity = ?, 
            secondaryQuantity = ? 
           WHERE id = ? AND firmId = ?`,
          [newPrimaryQty, newSecondaryQty, item.itemId, firmId]
        );
      }
    } catch (error) {
      console.error(`Error updating stock for item ${item.itemId}:`, error);
    }
  }
}

// Modified updatePartyBalance to support reversal
export async function updatePartyBalance(
  document: any,
  firmId: string,
  reverse: boolean = false
) {
  if (!document.partyId) return;

  const partyResult = await db.raw(
    "SELECT currentBalance, currentBalanceType FROM parties WHERE id = ? AND firmId = ?",
    [document.partyId, firmId]
  );

  if (!partyResult || partyResult.length === 0) return;

  const party = partyResult[0];
  const currentBalance = Number(party.currentBalance) || 0;
  const balanceType = party.currentBalanceType 

  const transactionAmount = Number(document.total) || 0;
  const paidAmount = Number(document.paidAmount) || 0;
  const balanceAmount = transactionAmount - paidAmount;

  if (balanceAmount === 0) return; // fully paid

let effectiveIsCustomer = null;

switch (document.documentType) {
  case "sale":
  case "sale_invoice":
    effectiveIsCustomer = true;
    break;
  case "sale_return":
    effectiveIsCustomer = false; // we give money back
    break;
  case "purchase":
  case "purchase_invoice":
    effectiveIsCustomer = false;
    break;
  case "purchase_return":
    effectiveIsCustomer = true; // supplier gives us money
    break;
  default:
    return; // unknown type, skip balance update
}

// Reverse effect if needed
if (reverse) effectiveIsCustomer = !effectiveIsCustomer;
  let newBalance = currentBalance;
  let newBalanceType = balanceType;

  if (effectiveIsCustomer) {
    // customer owes us money
    if (balanceType === "to_pay") {
      if (currentBalance >= balanceAmount) {
        newBalance = currentBalance - balanceAmount;
      } else {
        newBalance = balanceAmount - currentBalance;
        newBalanceType = "to_receive";
      }
    } else {
      newBalance = currentBalance + balanceAmount;
    }
  } else {
    // we owe supplier money
    if (balanceType === "to_receive") {
      if (currentBalance >= balanceAmount) {
        newBalance = currentBalance - balanceAmount;
      } else {
        newBalance = balanceAmount - currentBalance;
        newBalanceType = "to_pay";
      }
    } else {
      newBalance = currentBalance + balanceAmount;
    }
  }

  await db.raw(
    `UPDATE parties SET 
     currentBalance = ?, 
     currentBalanceType = ?
     WHERE id = ? AND firmId = ?`,
    [newBalance, newBalanceType, document.partyId, firmId]
  );
}

/**
 * Updates bank account balance when payment type is bank
 * @param {any} document - Document containing payment information
 * @param {string} firmId - ID of the firm
 * @param {boolean} reverse - Whether to reverse the bank operation (e.g. for cancellations/updates)
 */
export async function updateBankBalance(
  document: any,
  firmId: string,
  reverse: boolean = false
) {
  // Only update bank balance if payment type is bank and bankId is provided
  if (document.paymentType !== "bank" || !document.bankId) {
    return;
  }

  const paidAmount = Number(document.paidAmount) || 0;

  // Skip if no payment was made
  if (paidAmount === 0) {
    return;
  }

  try {
    // Fetch current bank account balance
    const bankResult = await db.raw(
      "SELECT currentBalance FROM bank_accounts WHERE id = ? AND firmId = ?",
      [document.bankId, firmId]
    );

    if (!bankResult || bankResult.length === 0) {
      console.log(
        `Bank account ${document.bankId} not found, skipping balance update`
      );
      return;
    }

    const currentBalance = Number(bankResult[0].currentBalance) || 0;

    // Determine if this is money coming in or going out
    const isSale =
      document.documentType.startsWith("sale_") ||
      document.documentType === "sale";
    const isPurchase = document.documentType.startsWith("purchase_");

    let newBalance = currentBalance;

    if (isSale) {
      // Sale: Money comes into bank account
      if (reverse) {
        newBalance = currentBalance - paidAmount; // Reverse: subtract
      } else {
        newBalance = currentBalance + paidAmount; // Normal: add
      }
    } else if (isPurchase) {
      // Purchase: Money goes out of bank account (can go negative)
      if (reverse) {
        newBalance = currentBalance + paidAmount; // Reverse: add back
      } else {
        newBalance = currentBalance - paidAmount; // Normal: subtract (allows negative)
      }
    }

    // Update bank account balance (no restriction on negative balances)
    await db.raw(
      "UPDATE bank_accounts SET currentBalance = ?, updatedAt = ? WHERE id = ? AND firmId = ?",
      [newBalance, new Date().toISOString(), document.bankId, firmId]
    );
  } catch (error) {
    console.error(
      `Error updating bank balance for account ${document.bankId}:`,
      error
    );
  }
}
