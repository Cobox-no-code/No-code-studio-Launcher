// lib/db.ts

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join('C:\\ProgramData', 'vypaar.db');

const sqlite = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) console.error('DB error:', err.message)
    else console.log('Connected to SQLite DB.')
  }
);

type Insertable = Record<string, any>;

interface QueryBuilderInstance<T> {
  insert: (data: Insertable) => Promise<T>;
  select: () => Promise<T[]>;
  first: () => Promise<T | undefined>;
  update: (data: Partial<T>) => Promise<any>;
  delete: () => Promise<any>;
  where: (column: string, value: any) => QueryBuilderInstance<T>;
  whereOp: (column: string, operator: string, value: any) => QueryBuilderInstance<T>;
  whereIn: (column: string, values: any[]) => QueryBuilderInstance<T>;
  increment: (column: string, amount?: number) => Promise<any>;
  decrement: (column: string, amount?: number) => Promise<any>;
  raw: (sql: string, params?: any[]) => Promise<any>;
}

interface DbInterface {
  <T = any>(table: string, firmId?: string): QueryBuilderInstance<T>;
  exec: (sql: string) => Promise<void>;
  raw: (sql: string, params?: any[]) => Promise<any>;
}

function queryBuilder<T = any>(table: string, firmId?: string): QueryBuilderInstance<T> {
  let whereClause = '';
  let whereParams: any[] = [];

  const builder: QueryBuilderInstance<T> = {
    insert: (data: Insertable): Promise<T> => {
      if (firmId) data.firmId = firmId;
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      const values = keys.map((k) =>
        typeof data[k] === 'boolean' ? (data[k] ? 1 : 0) : data[k]
      );

      return new Promise((resolve, reject) => {
        sqlite.run(sql, values, function (err) {
          if (err) return reject(err);
          resolve(data as T);
        });
      });
    },

    select: (): Promise<T[]> => {
      const firmCondition = firmId ? `WHERE firmId = ?` : '';
      const finalClause = whereClause || firmCondition;
      const finalParams = whereClause ? whereParams : firmId ? [firmId] : [];

      const sql = `SELECT * FROM ${table} ${finalClause}`;
      return new Promise((resolve, reject) => {
        sqlite.all(sql, finalParams, (err, rows) => {
          if (err) return reject(err);
          resolve(rows as T[]);
        });
      });
    },

    first: (): Promise<T | undefined> => {
      const firmCondition = firmId ? `WHERE firmId = ?` : '';
      const finalClause = whereClause || firmCondition;
      const finalParams = whereClause ? whereParams : firmId ? [firmId] : [];

      const sql = `SELECT * FROM ${table} ${finalClause} LIMIT 1`;
      return new Promise((resolve, reject) => {
        sqlite.get(sql, finalParams, (err, row) => {
          if (err) return reject(err);
          resolve(row as T | undefined);
        });
      });
    },

    update: (data: Partial<T>) => {
      const keys = Object.keys(data);
      const setClause = keys.map((key) => `${key} = ?`).join(', ');
      const values = keys.map((k) =>
        typeof (data as any)[k] === 'boolean'
          ? (data as any)[k]
            ? 1
            : 0
          : (data as any)[k]
      );

      const sql = `UPDATE ${table} SET ${setClause} ${whereClause}`;
      return new Promise((resolve, reject) => {
        sqlite.run(sql, [...values, ...whereParams], function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        });
      });
    },

    delete: () => {
      const sql = `DELETE FROM ${table} ${whereClause}`;
      return new Promise((resolve, reject) => {
        sqlite.run(sql, whereParams, function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        });
      });
    },

    where: (column: string, value: any) => {
      whereClause = `WHERE ${column} = ?`;
      whereParams = [value];
      return builder;
    },

    whereOp: (column: string, operator: string, value: any) => {
      whereClause = `WHERE ${column} ${operator} ?`;
      whereParams = [value];
      return builder;
    },

    whereIn: (column: string, values: any[]) => {
      const placeholders = values.map(() => '?').join(', ');
      whereClause = `WHERE ${column} IN (${placeholders})`;
      whereParams = values;
      return builder;
    },

    increment: (column: string, amount: number = 1) => {
      const sql = `UPDATE ${table} SET ${column} = ${column} + ? ${whereClause}`;
      return new Promise((resolve, reject) => {
        sqlite.run(sql, [amount, ...whereParams], function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        });
      });
    },

    decrement: (column: string, amount: number = 1) => {
      const sql = `UPDATE ${table} SET ${column} = ${column} - ? ${whereClause}`;
      return new Promise((resolve, reject) => {
        sqlite.run(sql, [amount, ...whereParams], function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        });
      });
    },

    raw: (sql: string, params: any[] = []): Promise<any> => {
      return new Promise((resolve, reject) => {
        sqlite.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    }
  };

  return builder;
}

// Create enhanced raw function
function rawSql(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    sqlite.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Export the db object with both queryBuilder and raw function
export const db = Object.assign(queryBuilder, {
  exec: (sql: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      sqlite.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  raw: rawSql
}) as DbInterface;
export async function initializFirm() {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS firms (
        id TEXT PRIMARY KEY,
        country TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)
  } catch (error) {
    console.error('Error initializing firm:', error)
    throw error
  }
}
// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create Categories table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        firmId TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    // Create Units table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        firmId TEXT NOT NULL,
        fullname TEXT NOT NULL,
        shortname TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    // Create Unit Conversions table - Fixed trailing comma
    await db.exec(`
      CREATE TABLE IF NOT EXISTS unit_conversions (
        id TEXT PRIMARY KEY,
        firmId TEXT NOT NULL,
        primaryUnitId TEXT NOT NULL,
        secondaryUnitId TEXT NOT NULL,
        conversionRate REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (primaryUnitId) REFERENCES units (id),
        FOREIGN KEY (secondaryUnitId) REFERENCES units (id)
      )
    `)

    // Create Items table (compatible with your existing schema)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        firmId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT CHECK (type IN ('PRODUCT', 'SERVICE')) NOT NULL,
        hsnCode TEXT,
        itemCode TEXT,
        description TEXT,
        imageUrl TEXT,
        categoryId TEXT,
        
        unit_conversionId TEXT,
        
        salePrice REAL NOT NULL,
        salePriceTaxInclusive INTEGER NOT NULL DEFAULT 0 CHECK (salePriceTaxInclusive IN (0, 1)),
        saleDiscount REAL,
        saleDiscountType TEXT CHECK (saleDiscountType IN ('percentage', 'amount')),
        wholesalePrice REAL,
        
        purchasePrice REAL,
        purchasePriceTaxInclusive INTEGER DEFAULT 0 CHECK (purchasePriceTaxInclusive IN (0, 1)),
        
        taxRate TEXT,
        primaryQuantity REAL,
        secondaryQuantity REAL,     
        primaryOpeningQuantity REAL,
        secondaryOpeningQuantity REAL,
        pricePerUnit REAL,
        minStockLevel REAL,
        location TEXT,
        openingStockDate TEXT,
        enableBatchTracking INTEGER DEFAULT 0 CHECK (enableBatchTracking IN (0, 1)),
        batchNumber TEXT,
        expiryDate TEXT,
        mfgDate TEXT,
        
        isActive INTEGER NOT NULL DEFAULT 1 CHECK (isActive IN (0, 1)),
        allowNegativeStock INTEGER DEFAULT 0 CHECK (allowNegativeStock IN (0, 1)),
        isFavorite INTEGER DEFAULT 0 CHECK (isFavorite IN (0, 1)),
        
        customFields TEXT,
        
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        
        FOREIGN KEY (categoryId) REFERENCES categories (id),
        FOREIGN KEY (unit_conversionId) REFERENCES unit_conversions (id)
        
      )
    `)
    // Create Groups table
    await db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    groupName TEXT NOT NULL,
    description TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`)

    // Create Parties table
    await db.exec(`
  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    name TEXT NOT NULL,
    gstNumber TEXT,
    phone TEXT,
    email TEXT,
    groupId TEXT,
    gstType TEXT NOT NULL,
    state TEXT,
    billingAddress TEXT,
    shippingAddress TEXT,
    shippingEnabled INTEGER CHECK (shippingEnabled IN (0, 1)),
    openingBalance REAL,
    openingBalanceType TEXT CHECK (openingBalanceType IN ('to_pay', 'to_receive')),
    openingBalanceDate TEXT,
    creditLimitType TEXT DEFAULT 'none',
    creditLimitValue REAL,
    paymentReminderEnabled INTEGER CHECK (paymentReminderEnabled IN (0, 1)),
    paymentReminderDays INTEGER,
    loyaltyPointsEnabled INTEGER CHECK (loyaltyPointsEnabled IN (0, 1)),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (groupId) REFERENCES groups (id)
  )
`)

    // Create a separate table for additional fields
    await db.exec(`
  CREATE TABLE IF NOT EXISTS party_additional_fields (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    partyId TEXT NOT NULL,
    fieldKey TEXT NOT NULL,
    fieldValue TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (partyId) REFERENCES parties (id) ON DELETE CASCADE
    
  )
`)

// Create the documents table for all document types
await db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    documentType TEXT NOT NULL CHECK (documentType IN (
      'sale_invoice', 'sale_order', 'sale_return', 'sale_quotation', 'delivery_challan',
      'purchase_invoice', 'purchase_order', 'purchase_return'
    )),
    documentNumber TEXT NOT NULL,
    documentDate TEXT NOT NULL,
    documentTime TEXT,
    
    -- Party information
    partyId TEXT,
    partyName TEXT NOT NULL,
    phone TEXT,
    partyType TEXT CHECK (partyType IN ('customer', 'supplier')) NOT NULL,
    
    -- Transaction details
    transactionType TEXT CHECK (transactionType IN ('credit', 'cash')) NOT NULL,
    status TEXT DEFAULT 'draft',
    
    -- Common fields
    ewaybill TEXT,
    billingAddress TEXT,
    billingName TEXT,
    poDate TEXT,
    poNumber TEXT,
    stateOfSupply TEXT,
    roundOff REAL DEFAULT 0,
    total REAL NOT NULL,
    
    -- Shipping details
    transportName TEXT,
    vehicleNumber TEXT,
    deliveryDate TEXT,
    deliveryLocation TEXT,
    
    -- Additional charges
    shipping REAL,
    packaging REAL,
    adjustment REAL,
    
    -- Payment details
    paymentType TEXT NOT NULL,
    bankId TEXT,
    chequeNumber TEXT,
    chequeDate TEXT,
    
    -- Other fields
    description TEXT,
    image TEXT,
    
    -- Discount and tax fields
    discountPercentage REAL,
    discountAmount REAL,
    taxPercentage REAL,
    taxAmount REAL,
    
    -- Payment amounts
    balanceAmount REAL NOT NULL,
    paidAmount REAL NOT NULL,
    
    -- Audit fields
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (partyId) REFERENCES parties (id),
    FOREIGN KEY (bankId) REFERENCES bank_accounts (id)
  )
`);

// Create indexes for the documents table
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(documentType);
  CREATE INDEX IF NOT EXISTS idx_documents_party ON documents(partyId);
  CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(documentDate)
`);

// Create the document items table
await db.exec(`
  CREATE TABLE IF NOT EXISTS document_items (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    documentId TEXT NOT NULL,
    itemId TEXT NOT NULL,
    itemName TEXT NOT NULL,
    
    -- Quantity with primary/secondary unit
    primaryQuantity REAL NOT NULL,
    secondaryQuantity REAL,
    
    -- Units
    primaryUnitId TEXT NOT NULL,
    primaryUnitName TEXT NOT NULL,
    secondaryUnitId TEXT,
    secondaryUnitName TEXT,
    unit_conversionId TEXT,
    conversionRate REAL,
    
    -- Pricing
    pricePerUnit REAL NOT NULL,
    amount REAL NOT NULL,
    
    -- Batch details
    mfgDate TEXT,
    batchNo TEXT,
    expDate TEXT,
    
    -- Tax details
    taxType TEXT,
    taxRate TEXT,
    taxAmount REAL,
    
    -- Category
    categoryId TEXT,
    categoryName TEXT,
    
    -- Additional details
    itemCode TEXT,
    hsnCode TEXT,
    serialNo TEXT,
    description TEXT,
    modelNo TEXT,
    mrp REAL,
    size TEXT,
    discountPercent REAL,
    discountAmount REAL,
    
    -- Audit fields
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (documentId) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (itemId) REFERENCES items (id),
    FOREIGN KEY (primaryUnitId) REFERENCES units (id),
    FOREIGN KEY (secondaryUnitId) REFERENCES units (id),
    FOREIGN KEY (categoryId) REFERENCES categories (id)
  )
`);

// Create index for document items
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_document_items_doc ON document_items(documentId)
`);

// Create the document charges table
await db.exec(`
  CREATE TABLE IF NOT EXISTS document_charges (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    documentId TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (documentId) REFERENCES documents (id) ON DELETE CASCADE
  )
`);

// Create index for document charges
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_document_charges_doc ON document_charges(documentId)
`);

// Create the document transportation details table
await db.exec(`
  CREATE TABLE IF NOT EXISTS document_transportation (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    documentId TEXT NOT NULL,
    type TEXT NOT NULL,
    detail TEXT NOT NULL,
    amount REAL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (documentId) REFERENCES documents (id) ON DELETE CASCADE
  )
`);

// Create index for document transportation
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_document_transport_doc ON document_transportation(documentId)
`);

// Create the document relationships table
await db.exec(`
  CREATE TABLE IF NOT EXISTS document_relationships (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    sourceDocumentId TEXT NOT NULL,
    targetDocumentId TEXT NOT NULL,
    relationshipType TEXT NOT NULL CHECK (relationshipType IN (
      'converted', 'fulfilled', 'returned', 'partial_fulfilled', 'partial_returned', 'referenced'
    )),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (sourceDocumentId) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (targetDocumentId) REFERENCES documents (id) ON DELETE CASCADE
  )
`);

// Create indexes for document relationships
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_doc_rel_source ON document_relationships(sourceDocumentId);
  CREATE INDEX IF NOT EXISTS idx_doc_rel_target ON document_relationships(targetDocumentId)
`);

// Create the stock movements table
await db.exec(`
  CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    itemId TEXT NOT NULL,
    documentId TEXT NOT NULL,
    documentItemId TEXT,
    
    -- Movement details
    movementType TEXT NOT NULL CHECK (movementType IN ('in', 'out', 'adjustment', 'conversion')),
    
    -- Primary unit quantities
    primaryQuantity REAL NOT NULL,
    primaryUnitId TEXT NOT NULL,
    
    -- Secondary unit quantities (if applicable)
    secondaryQuantity REAL,
    secondaryUnitId TEXT,
    
    -- Additional information
    batchNumber TEXT,
    expiryDate TEXT,
    mfgDate TEXT,
    notes TEXT,
    
    -- Audit fields
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (itemId) REFERENCES items (id),
    FOREIGN KEY (documentId) REFERENCES documents (id) ON DELETE CASCADE,
    FOREIGN KEY (documentItemId) REFERENCES document_items (id) ON DELETE CASCADE
  )
`);

// Create indexes for stock movements
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(itemId);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_doc ON stock_movements(documentId)
`);



    // Create Bank Accounts table
    await db.exec(`
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    displayName TEXT NOT NULL,
    bankName TEXT NOT NULL,
    accountNumber TEXT NOT NULL,
    accountHolderName TEXT NOT NULL,
    ifscCode TEXT NOT NULL,
    upiId TEXT,
    openingBalance REAL NOT NULL,
    currentBalance REAL NOT NULL,
    asOfDate TEXT NOT NULL,
    printUpiQrOnInvoices INTEGER NOT NULL DEFAULT 0 CHECK (printUpiQrOnInvoices IN (0, 1)),
    printBankDetailsOnInvoices INTEGER NOT NULL DEFAULT 0 CHECK (printBankDetailsOnInvoices IN (0, 1)),
    isActive INTEGER NOT NULL DEFAULT 1 CHECK (isActive IN (0, 1)),
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`)

//     // Create PurchaseInvoices table
//     await db.exec(`
//   CREATE TABLE IF NOT EXISTS purchase_invoices (
//     id TEXT PRIMARY KEY,
//     firmId TEXT NOT NULL,
//     purchaseType TEXT CHECK (purchaseType IN ('credit', 'cash')) NOT NULL,
//     supplierId TEXT,
//     supplier TEXT NOT NULL,
//     phone TEXT,
//     ewaybill TEXT,
//     billingAddress TEXT,
//     billingName TEXT,
//     invoiceNumber TEXT NOT NULL,
//     invoiceTime TEXT,
//     poDate TEXT,
//     poNumber TEXT,
//     invoiceDate TEXT NOT NULL,
//     stateOfSupply TEXT,
//     roundOff REAL DEFAULT 0,
//     total REAL NOT NULL,
//     transportName TEXT,
//     vehicleNumber TEXT,
//     deliveryDate TEXT,
//     deliveryLocation TEXT,
//     shipping REAL,
//     packaging REAL,
//     adjustment REAL,
//     paymentType TEXT CHECK (paymentType IN ('cash', 'cheque', 'bank')) NOT NULL,
//     bankId TEXT,
//     chequeNumber TEXT,
//     chequeDate TEXT,
//     description TEXT,
//     image TEXT,
//     discountPercentage REAL,
//     discountAmount REAL,
//     taxPercentage REAL,
//     taxAmount REAL,
//     balanceAmount REAL NOT NULL,
//     paidAmount REAL NOT NULL,
//     createdAt TEXT NOT NULL,
//     updatedAt TEXT NOT NULL,
//     FOREIGN KEY (supplierId) REFERENCES parties (id),
//     FOREIGN KEY (bankId) REFERENCES bank_accounts (id)
//   )
// `)

//     // Create PurchaseInvoiceItems table
//     await db.exec(`
//   CREATE TABLE IF NOT EXISTS purchase_invoice_items (
//    id TEXT PRIMARY KEY,
//         firmId TEXT NOT NULL,
//         invoiceId TEXT NOT NULL,
//         itemId TEXT NOT NULL,
//         item TEXT NOT NULL,
    
//         primaryQuantity REAL NOT NULL,
//         secondaryQuantity REAL,
    
//         primaryUnitId TEXT,
//         primaryUnit TEXT NOT NULL,
    
//         secondaryUnitId TEXT,
//         secondaryUnit TEXT,
    
//         pricePerUnit REAL NOT NULL,
//         mfgDate TEXT,
//         taxType TEXT,
//         taxRateId TEXT,
//         taxAmount REAL,
//         amount REAL NOT NULL,
    
//         categoryId TEXT,
//         category TEXT,
    
//         itemCode TEXT,
//         hsnCode TEXT,
//         serialNo TEXT,
//         description TEXT,
//         batchNo TEXT,
//         modelNo TEXT,
//         expDate TEXT,
//         mrp REAL,
//         size TEXT,
//         discountPercent REAL,
//         discountAmount REAL,
    
//         createdAt TEXT NOT NULL,
//         updatedAt TEXT NOT NULL,
    
//         FOREIGN KEY (invoiceId) REFERENCES sale_invoices (id) ON DELETE CASCADE,
//         FOREIGN KEY (itemId) REFERENCES items (id),
//         FOREIGN KEY (unitId) REFERENCES units (id),
//         FOREIGN KEY (secondaryUnitId) REFERENCES units (id),
//         FOREIGN KEY (categoryId) REFERENCES categories (id),
//         FOREIGN KEY (taxRateId) REFERENCES tax_rates (id)

//   )
// `)

//     // Create PurchaseChargeDetails table
//     await db.exec(`
//   CREATE TABLE IF NOT EXISTS purchase_charge_details (
//     id TEXT PRIMARY KEY,
//     firmId TEXT NOT NULL,
//     invoiceId TEXT NOT NULL,
//     name TEXT NOT NULL,
//     amount REAL NOT NULL,
//     createdAt TEXT NOT NULL,
//     updatedAt TEXT NOT NULL,
//     FOREIGN KEY (invoiceId) REFERENCES purchase_invoices (id) ON DELETE CASCADE
//   )
// `)

//     // Create PurchaseTransportationDetails table
//     await db.exec(`
//   CREATE TABLE IF NOT EXISTS purchase_transportation_details (
//     id TEXT PRIMARY KEY,
//     invoiceId TEXT NOT NULL,
//     firmId TEXT NOT NULL,
//     type TEXT NOT NULL,
//     detail TEXT NOT NULL,
//     amount REAL,
//     createdAt TEXT NOT NULL,
//     updatedAt TEXT NOT NULL,
//     FOREIGN KEY (invoiceId) REFERENCES purchase_invoices (id) ON DELETE CASCADE
//   )
// `)

    // Create Bank Transactions table
    await db.exec(`
  CREATE TABLE IF NOT EXISTS bank_transactions (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    bankAccountId TEXT NOT NULL,
    amount REAL NOT NULL,
    transactionType TEXT NOT NULL CHECK (transactionType IN ('deposit', 'withdrawal', 'transfer', 'interest', 'charge', 'payment', 'receipt')),
    transactionDate TEXT NOT NULL,
    description TEXT NOT NULL,
    referenceNumber TEXT,
    relatedEntityId TEXT,
    relatedEntityType TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (bankAccountId) REFERENCES bank_accounts (id) ON DELETE CASCADE
  )
`)
await db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    amount REAL NOT NULL,
    paymentType TEXT NOT NULL CHECK (paymentType IN ('cash', 'cheque', 'bank')),
    paymentDate TEXT NOT NULL,
    referenceNumber TEXT,
    partyId TEXT,
    partyName TEXT,
    description TEXT,
    receiptNumber TEXT,
    bankAccountId TEXT,
    chequeNumber TEXT,
    chequeDate TEXT,
    imageUrl TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    linkedDocumentId TEXT,
    linkedDocumentType TEXT,
    isReconciled INTEGER DEFAULT 0 CHECK (isReconciled IN (0, 1)),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (partyId) REFERENCES parties (id),
    FOREIGN KEY (bankAccountId) REFERENCES bank_accounts (id)
  )
`);

// Create indexes for faster queries
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_payments_firmId ON payments (firmId);
  CREATE INDEX IF NOT EXISTS idx_payments_direction ON payments (direction);
  CREATE INDEX IF NOT EXISTS idx_payments_partyId ON payments (partyId);
  CREATE INDEX IF NOT EXISTS idx_payments_bankAccountId ON payments (bankAccountId);
  CREATE INDEX IF NOT EXISTS idx_payments_paymentDate ON payments (paymentDate);
`);

    console.log('Database schema initialized successfully')
  } catch (error) {
    console.error('Error initializing database schema:', error)
    throw error
  }
}
// Initialize default data (basic units, categories, etc.)
