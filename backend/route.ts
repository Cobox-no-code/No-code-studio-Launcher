import { Router } from "express";
import * as unitController from "./controllers/units.controller";
import * as unitConversionController from "./controllers/unit-conversions.controller";
import * as categoryController from "./controllers/categories.controller";
import * as itemController from "./controllers/items.controller";
import * as partyController from "./controllers/parties.controller";
import * as groupController from "./controllers/groups.controller";
import * as bankAccountController from "./controllers/accounts.controller";
import * as bankTransactionController from "./controllers/transaction.controller";
import * as paymentController from "./controllers/payments.controller";
import * as documentController from "./controllers/documents.controller";
import * as initController from "./controllers/init.controller";
import * as initDataController from "./controllers/initData.controller";
import * as firmController from "./controllers/firms.controller";
import * as syncToCloud from "./controllers/syncCloud.controller";

import { attachFirmConfig } from "./middleware/attachFirmConfig";
import { syncCloudAfterChange } from "./middleware/syncCloudAfterChange";

const router = Router();

// Global middleware to attach firm config
router.use(attachFirmConfig);

// Initialization
router.get("/init", initController.initializeHandler);
router.get("/initData", initDataController.initDataHandler);

// Firms
router.get("/firms", firmController.getAllFirms);
router.post("/firms", firmController.createFirm, syncCloudAfterChange("firms"));
router.get("/firms/:id", firmController.getFirmById);
router.put(
  "/firms/:id",
  firmController.updateFirm,
  syncCloudAfterChange("firms")
);
router.delete(
  "/firms/:id",
  firmController.deleteFirm,
  syncCloudAfterChange("firms")
);

// Items & Subroutes
router.get("/items", itemController.getItems);
router.post("/items", itemController.createItem, syncCloudAfterChange("items"));
router.get("/items/categories", categoryController.getAllCategories);
router.post(
  "/items/categories",
  categoryController.createCategory,
  syncCloudAfterChange("categories")
);
router.get("/items/units", unitController.getAllUnits);
router.post(
  "/items/units",
  unitController.createUnit,
  syncCloudAfterChange("units")
);
router.get(
  "/items/unit-conversions",
  unitConversionController.getAllUnitConversions
);
router.post(
  "/items/unit-conversions",
  unitConversionController.createUnitConversion,
  syncCloudAfterChange("unit_conversions")
);
router.get("/items/:id", itemController.getItemById);
router.put(
  "/items/:id",
  itemController.updateItem,
  syncCloudAfterChange("items")
);
router.delete(
  "/items/:id",
  itemController.deleteItem,
  syncCloudAfterChange("items")
);

router.get("/items/categories/:id", categoryController.getCategoryById);
router.put(
  "/items/categories/:id",
  categoryController.updateCategory,
  syncCloudAfterChange("categories")
);
router.delete(
  "/items/categories/:id",
  categoryController.deleteCategory,
  syncCloudAfterChange("categories")
);

router.get("/items/units/:id", unitController.getUnitById);
router.put(
  "/items/units/:id",
  unitController.updateUnit,
  syncCloudAfterChange("units")
);
router.delete(
  "/items/units/:id",
  unitController.deleteUnit,
  syncCloudAfterChange("units")
);

router.get(
  "/items/unit-conversions/:id",
  unitConversionController.getUnitConversionById
);
router.put(
  "/items/unit-conversions/:id",
  unitConversionController.updateUnitConversion,
  syncCloudAfterChange("unit_conversions")
);
router.delete(
  "/items/unit-conversions/:id",
  unitConversionController.deleteUnitConversion,
  syncCloudAfterChange("unit_conversions")
);

// Parties
router.get("/parties", partyController.getAllParties);
router.post(
  "/parties",
  partyController.createParty,
  syncCloudAfterChange("parties")
);
router.get("/parties/groups", groupController.getAllGroups);
router.post(
  "/parties/groups",
  groupController.createGroup,
  syncCloudAfterChange("groups")
);
router.get("/parties/:id", partyController.getPartyById);
router.put(
  "/parties/:id",
  partyController.updateParty,
  syncCloudAfterChange("parties")
);
router.delete(
  "/parties/:id",
  partyController.deleteParty,
  syncCloudAfterChange("parties")
);

router.get("/parties/groups/:id", groupController.getGroupById);
router.put(
  "/parties/groups/:id",
  groupController.updateGroup,
  syncCloudAfterChange("groups")
);
router.delete(
  "/parties/groups/:id",
  groupController.deleteGroup,
  syncCloudAfterChange("groups")
);

// Banking
router.get("/banking/accounts", bankAccountController.getAllBankAccounts);
router.post(
  "/banking/accounts",
  bankAccountController.createBankAccount,
  syncCloudAfterChange("bank_accounts")
);
router.get("/banking/accounts/:id", bankAccountController.getBankAccountById);
router.put(
  "/banking/accounts/:id",
  bankAccountController.updateBankAccount,
  syncCloudAfterChange("bank_accounts")
);
router.delete(
  "/banking/accounts/:id",
  bankAccountController.deleteBankAccount,
  syncCloudAfterChange("bank_accounts")
);

router.get(
  "/banking/transactions",
  bankTransactionController.getAllBankTransactions
);
router.post(
  "/banking/transactions",
  bankTransactionController.createBankTransaction,
  syncCloudAfterChange("bank_transactions")
);
router.get(
  "/banking/transactions/:id",
  bankTransactionController.getBankTransactionById
);
router.put(
  "/banking/transactions/:id",
  bankTransactionController.updateBankTransaction,
  syncCloudAfterChange("bank_transactions")
);
router.delete(
  "/banking/transactions/:id",
  bankTransactionController.deleteBankTransaction,
  syncCloudAfterChange("bank_transactions")
);

// Payments
router.get("/payment", paymentController.getAllPayments);
router.post(
  "/payment",
  paymentController.createPayment,
  syncCloudAfterChange("payments")
);
router.get("/payment/:id", paymentController.getPaymentById);
router.put(
  "/payment/:id",
  paymentController.updatePayment,
  syncCloudAfterChange("payments")
);
router.delete(
  "/payment/:id",
  paymentController.deletePayment,
  syncCloudAfterChange("payments")
);

// Documents
router.get("/documents", documentController.getAllDocuments);
router.post(
  "/documents",
  documentController.createDocument,
  syncCloudAfterChange("documents")
);
router.get("/documents/:id", documentController.getDocumentById);
router.put(
  "/documents/:id",
  documentController.updateDocument,
  syncCloudAfterChange("documents")
);
router.delete(
  "/documents/:id",
  documentController.deleteDocument,
  syncCloudAfterChange("documents")
);

// Manual Sync
router.post("/sync-cloud/all", syncToCloud.syncToCloud);
router.post("/sync-local/all", syncToCloud.syncToLocal);

export default router;
