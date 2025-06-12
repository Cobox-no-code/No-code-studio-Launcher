import { Router } from "express";
import express from "express";
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

import { syncCloudAfterChangeFn } from "./middleware/syncCloudAfterChange";

// import { getLoginQRCode, sendPDFController } from "./controllers/whatsapp.controller";
import { upload } from "./controllers/whatsapp/multer.config";
function withSync(controllerFn: any, model: string) {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await syncCloudAfterChangeFn(model, req, res);
      }
    });

    try {
      await controllerFn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}





const router = Router();
// router.get('/qr', getLoginQRCode);

// router.post('/send-pdf', upload.single('file'), sendPDFController);
// Initialization
router.get("/init", initController.initializeHandler);
router.get("/initData", initDataController.initDataHandler);

// Firms
router.get("/firms", firmController.getAllFirms);
router.post("/firms", withSync(firmController.createFirm, "firms"));
router.get("/firms/:id", firmController.getFirmById);
router.put("/firms/:id", withSync(firmController.updateFirm, "firms"));
router.delete("/firms/:id", withSync(firmController.deleteFirm, "firms"));

// Items & Subroutes
router.get("/items", itemController.getItems);
router.post("/items", withSync(itemController.createItem, "items"));
router.get("/items/categories", categoryController.getAllCategories);
router.post(
  "/items/categories",
  withSync(categoryController.createCategory, "categories")
);
router.get("/items/units", unitController.getAllUnits);
router.post("/items/units", withSync(unitController.createUnit, "units"));
router.get(
  "/items/unit-conversions",
  unitConversionController.getAllUnitConversions
);
router.post(
  "/items/unit-conversions",
  withSync(unitConversionController.createUnitConversion, "unit_conversions")
);
router.get("/items/:id", itemController.getItemById);
router.put("/items/:id", withSync(itemController.updateItem, "items"));
router.delete("/items/:id", withSync(itemController.deleteItem, "items"));

router.get("/items/categories/:id", categoryController.getCategoryById);
router.put(
  "/items/categories/:id",
  withSync(categoryController.updateCategory, "categories")
);
router.delete(
  "/items/categories/:id",
  withSync(categoryController.deleteCategory, "categories")
);

router.get("/items/units/:id", unitController.getUnitById);
router.put("/items/units/:id", withSync(unitController.updateUnit, "units"));
router.delete("/items/units/:id", withSync(unitController.deleteUnit, "units"));

router.get(
  "/items/unit-conversions/:id",
  unitConversionController.getUnitConversionById
);
router.put(
  "/items/unit-conversions/:id",
  withSync(unitConversionController.updateUnitConversion, "unit_conversions")
);
router.delete(
  "/items/unit-conversions/:id",
  withSync(unitConversionController.deleteUnitConversion, "unit_conversions")
);

// Parties
router.get("/parties", partyController.getAllParties);
router.post("/parties", withSync(partyController.createParty, "parties"));
router.get("/parties/groups", groupController.getAllGroups);
router.post("/parties/groups", withSync(groupController.createGroup, "groups"));
router.get("/parties/:id", partyController.getPartyById);
router.put("/parties/:id", withSync(partyController.updateParty, "parties"));
router.delete("/parties/:id", withSync(partyController.deleteParty, "parties"));

router.get("/parties/groups/:id", groupController.getGroupById);
router.put(
  "/parties/groups/:id",
  withSync(groupController.updateGroup, "groups")
);
router.delete(
  "/parties/groups/:id",
  withSync(groupController.deleteGroup, "groups")
);

// Banking
router.get("/banking/accounts", bankAccountController.getAllBankAccounts);
router.post(
  "/banking/accounts",
  withSync(bankAccountController.createBankAccount, "bank_accounts")
);
router.get("/banking/accounts/:id", bankAccountController.getBankAccountById);
router.put(
  "/banking/accounts/:id",
  withSync(bankAccountController.updateBankAccount, "bank_accounts")
);
router.delete(
  "/banking/accounts/:id",
  withSync(bankAccountController.deleteBankAccount, "bank_accounts")
);

router.get(
  "/banking/transactions",
  bankTransactionController.getAllBankTransactions
);
router.post(
  "/banking/transactions",
  withSync(bankTransactionController.createBankTransaction, "bank_transactions")
);
router.get(
  "/banking/transactions/:id",
  bankTransactionController.getBankTransactionById
);
router.put(
  "/banking/transactions/:id",
  withSync(bankTransactionController.updateBankTransaction, "bank_transactions")
);
router.delete(
  "/banking/transactions/:id",
  withSync(bankTransactionController.deleteBankTransaction, "bank_transactions")
);

// Payments
router.get("/payment", paymentController.getAllPayments);
router.post("/payment", withSync(paymentController.createPayment, "payments"));
router.get("/payment/:id", paymentController.getPaymentById);
router.put(
  "/payment/:id",
  withSync(paymentController.updatePayment, "payments")
);
router.delete(
  "/payment/:id",
  withSync(paymentController.deletePayment, "payments")
);

// Documents
router.get("/documents", documentController.getAllDocuments);
router.post(
  "/documents",
  withSync(documentController.createDocument, "documents")
);
router.get("/documents/:id", documentController.getDocumentById);
router.put(
  "/documents/:id",
  withSync(documentController.updateDocument, "documents")
);
router.delete(
  "/documents/:id",
  withSync(documentController.deleteDocument, "documents")
);

// Manual Sync
router.post("/sync-cloud/all", syncToCloud.syncToCloud);
router.post("/sync-local/all", syncToCloud.syncToLocal);

export default router;
