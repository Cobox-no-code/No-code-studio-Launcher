import { Request, Response } from "express";
import { db } from "./../lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  insertDocument,
  insertDocumentCharges,
  insertDocumentItems,
  insertDocumentTransportation,
  updateBankBalance,
  updatePartyBalance,
  updateStockQuantities,
} from "./_helper/db-helper";
// GET /documents
export const getAllDocuments = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    if (!firmId) return res.status(400).json({ error: "Firm ID is required" });

    const {
      documentType,
      partyId,
      startDate,
      endDate,
      status,
      search,
      transactionType,
    } = req.query;

    let query = "SELECT * FROM documents WHERE firmId = ?";
    const params: any[] = [firmId];

    if (documentType) {
      query += " AND documentType = ?";
      params.push(documentType);
    }
    if (partyId) {
      query += " AND partyId = ?";
      params.push(partyId);
    }
    if (startDate) {
      query += " AND documentDate >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND documentDate <= ?";
      params.push(endDate);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (transactionType) {
      query += " AND transactionType = ?";
      params.push(transactionType);
    }
    if (search) {
      const s = `%${search}%`;
      query +=
        " AND (partyName LIKE ? OR documentNumber LIKE ? OR phone LIKE ?)";
      params.push(s, s, s);
    }

    query += " ORDER BY documentDate DESC, createdAt DESC";
    const documents = await db.raw(query, params);

    for (const doc of documents) {
      doc.items = await db.raw(
        "SELECT * FROM document_items WHERE documentId = ?",
        [doc.id]
      );
      doc.charges = await db.raw(
        "SELECT * FROM document_charges WHERE documentId = ?",
        [doc.id]
      );
      doc.transportation = await db.raw(
        "SELECT * FROM document_transportation WHERE documentId = ?",
        [doc.id]
      );
    }

    res.json(documents);
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /documents
export const createDocument = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    if (!firmId) return res.status(400).json({ error: "Firm ID is required" });

    const body = req.body;

    if (
      !body.documentType ||
      !body.documentDate ||
      !body.partyName ||
      !body.transactionType
    ) {
      return res.status(400).json({
        error:
          "documentType, documentDate, partyName, and transactionType are required",
      });
    }

    if (!body.documentNumber) {
      body.documentNumber = `DOC-${Date.now()}`;
    }

    const exists = await db.raw(
      "SELECT id FROM documents WHERE firmId = ? AND documentType = ? AND documentNumber = ?",
      [firmId, body.documentType, body.documentNumber]
    );

    if (exists?.length > 0) {
      return res.status(409).json({
        error: `Document number '${body.documentNumber}' already exists for this firm.`,
      });
    }

    const documentId = await insertDocument(body, firmId);
    await insertDocumentItems(body.items || [], documentId, firmId);
    await insertDocumentCharges(body.charges || [], documentId, firmId);
    await insertDocumentTransportation(
      body.transportation || [],
      documentId,
      firmId
    );
    await updateStockQuantities(body.documentType, body.items || [], firmId);
    await updatePartyBalance(body, firmId);
    await updateBankBalance(body, firmId);
    const created = await db.raw("SELECT * FROM documents WHERE id = ?", [
      documentId,
    ]);
    if (created.length === 0)
      return res
        .status(500)
        .json({ error: "Document created but not retrievable" });

    const doc = created[0];
    doc.items = await db.raw(
      "SELECT * FROM document_items WHERE documentId = ?",
      [documentId]
    );
    doc.charges = await db.raw(
      "SELECT * FROM document_charges WHERE documentId = ?",
      [documentId]
    );
    doc.transportation = await db.raw(
      "SELECT * FROM document_transportation WHERE documentId = ?",
      [documentId]
    );

    res.status(201).json(doc);
  } catch (error: any) {
    console.error("Error creating document:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /documents/:id
export const getDocumentById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    const { id } = req.params;

    const doc = await db.raw(
      "SELECT * FROM documents WHERE id = ? AND firmId = ?",
      [id, firmId]
    );
    if (!doc || doc.length === 0)
      return res.status(404).json({ error: "Document not found" });

    const [base] = doc;

    base.items = await db.raw(
      "SELECT * FROM document_items WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );
    base.charges = await db.raw(
      "SELECT * FROM document_charges WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );
    base.transportation = await db.raw(
      "SELECT * FROM document_transportation WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );

    base.relationships = {
      sourceDocuments: await db.raw(
        `
        SELECT dr.*, d.documentType, d.documentNumber, d.documentDate, d.status
        FROM document_relationships dr
        JOIN documents d ON dr.targetDocumentId = d.id
        WHERE dr.sourceDocumentId = ? AND dr.firmId = ?`,
        [id, firmId]
      ),
      targetDocuments: await db.raw(
        `
        SELECT dr.*, d.documentType, d.documentNumber, d.documentDate, d.status
        FROM document_relationships dr
        JOIN documents d ON dr.sourceDocumentId = d.id
        WHERE dr.targetDocumentId = ? AND dr.firmId = ?`,
        [id, firmId]
      ),
    };

    res.json(base);
  } catch (error: any) {
    console.error("Error fetching document by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /documents/:id
// PUT /documents/:id
export const updateDocument = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    const { id } = req.params;
    const body = req.body;

    // Check if document exists
    const existingDoc = await db.raw(
      "SELECT * FROM documents WHERE id = ? AND firmId = ?",
      [id, firmId]
    );
    if (!existingDoc || existingDoc.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get existing document data to revert stock quantities if needed
    const oldDoc = existingDoc[0];
    const oldItems = await db.raw(
      "SELECT * FROM document_items WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );

    // If document number is changed, check for duplicates
    if (body.documentNumber && body.documentNumber !== oldDoc.documentNumber) {
      const exists = await db.raw(
        "SELECT id FROM documents WHERE firmId = ? AND documentType = ? AND documentNumber = ? AND id != ?",
        [firmId, body.documentType, body.documentNumber, id]
      );

      if (exists?.length > 0) {
        return res.status(409).json({
          error: `Document number '${body.documentNumber}' already exists for this firm.`,
        });
      }
    }

    // First, revert the effects of the old document
    await updateStockQuantities(oldDoc.documentType, oldItems, firmId, true); // true flag to indicate reversal
    await updatePartyBalance(oldDoc, firmId, true); // true flag to indicate reversal

    // Then delete old related records
    await db.raw(
      "DELETE FROM document_items WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );
    await db.raw(
      "DELETE FROM document_charges WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );
    await db.raw(
      "DELETE FROM document_transportation WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );

    // Update the main document record
    const now = new Date().toISOString();
    const { items, charges, transportation, relationships, ...docFields } =
      body;

    // Build the update fields
    const updateFields: any = {
      ...docFields,
      updatedAt: now,
    };

    // Create the SQL update statement
    const updateKeys = Object.keys(updateFields);
    const updateSql = updateKeys.map((k) => `${k} = ?`).join(", ");
    const values = [...updateKeys.map((k) => updateFields[k]), id, firmId];

    await db.raw(
      `UPDATE documents SET ${updateSql} WHERE id = ? AND firmId = ?`,
      values
    );

    // Re-insert items, charges, and transportation
    await insertDocumentItems(items || [], id, firmId);
    await insertDocumentCharges(charges || [], id, firmId);
    await insertDocumentTransportation(transportation || [], id, firmId);

    // Apply new stock quantities and party balance updates
    await updateStockQuantities(body.documentType, items || [], firmId);
    await updatePartyBalance(body, firmId);
    await updateBankBalance(body, firmId);
    // Fetch the updated document
    const updated = await db.raw(
      "SELECT * FROM documents WHERE id = ? AND firmId = ?",
      [id, firmId]
    );
    if (!updated || updated.length === 0) {
      return res
        .status(500)
        .json({ error: "Document updated but not retrievable" });
    }

    const finalDoc = updated[0];
    finalDoc.items = await db.raw(
      "SELECT * FROM document_items WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );
    finalDoc.charges = await db.raw(
      "SELECT * FROM document_charges WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );
    finalDoc.transportation = await db.raw(
      "SELECT * FROM document_transportation WHERE documentId = ? AND firmId = ?",
      [id, firmId]
    );

    res.json(finalDoc);
  } catch (error: any) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /documents/:id
export const deleteDocument = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = req.headers["x-firm-id"] as string;
    const { id } = req.params;

    if (!firmId || !id) {
      return res
        .status(400)
        .json({ error: "Firm ID and document ID are required" });
    }

    // Fetch the document with its items
    const [document] = await db.raw(
      "SELECT * FROM documents WHERE id = ? AND firmId = ?",
      [id, firmId]
    );
    if (!document) return res.status(404).json({ error: "Document not found" });

    document.items = await db.raw(
      "SELECT * FROM document_items WHERE documentId = ?",
      [id]
    );

    // Reverse stock and party balance
    await updateStockQuantities(
      document.documentType,
      document.items || [],
      firmId,
      true
    );
    await updatePartyBalance(document, firmId, true);
    await updateBankBalance(document, firmId, true);
    // Delete related records
    await db.raw("DELETE FROM document_items WHERE documentId = ?", [id]);
    await db.raw("DELETE FROM document_charges WHERE documentId = ?", [id]);
    await db.raw("DELETE FROM document_transportation WHERE documentId = ?", [
      id,
    ]);
    await db.raw("DELETE FROM documents WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Document deleted and stock/payment reversed.",
    });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: error.message });
  }
};
