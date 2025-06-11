import { Request, Response } from "express";
import { db } from "./../lib/db";
import { v4 as uuidv4 } from "uuid";

// POST /items - Create new item
export const createItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const body = req.body;
    const existingItems = await db("items", firmId).select(); // fetch all fields

    // Then extract names in JS
    const exists = existingItems.some(
      (item) => item.name?.toLowerCase() === body.name?.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "Item name must be unique (case-insensitive)",
      });
    }

    if (body.customFields && typeof body.customFields === "object") {
      body.customFields = JSON.stringify(body.customFields);
    }

    const now = new Date().toISOString();
    const newItem = {
      id: uuidv4(),
      ...body,
      firmId,
      createdAt: now,
      updatedAt: now,
    };

    await db("items", firmId).insert(newItem);
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error creating item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /items - Get all items (optional filters)
export const getItems = async (req: Request, res: Response): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { type, categoryId } = req.query;

    let query = db("items", firmId);

    if (type) query = query.where("type", type);
    if (categoryId) query = query.where("categoryId", categoryId);

    const items = await query.select();

    const parsedItems = items.map((item) => {
      if (item.customFields && typeof item.customFields === "string") {
        try {
          return { ...item, customFields: JSON.parse(item.customFields) };
        } catch {
          return item;
        }
      }
      return item;
    });

    res.json(parsedItems);
  } catch (error: any) {
    console.error("Error fetching items:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /items/:id - Get item by ID
export const getItemById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { id } = req.params;

    const item = await db("items", firmId).where("id", id).first();

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (item.customFields && typeof item.customFields === "string") {
      try {
        item.customFields = JSON.parse(item.customFields);
      } catch {
        // Leave as is
      }
    }

    res.json(item);
  } catch (error: any) {
    console.error(`Error fetching item ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /items/:id - Update item by ID
export const updateItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { id } = req.params;
    const body = req.body;

    const existingItem = await db("items", firmId).where("id", id).first();
    if (!existingItem) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    // Check name conflict
    if (body.name && body.name !== existingItem.name) {
      const usedInDocuments = await db("document_items", firmId)
        .where("itemId", id)
        .first();

      if (usedInDocuments) {
        return res.status(400).json({
          success: false,
          error: "Cannot update item name. The item is used in one or more documents.",
        });
      }

      const possibleDuplicates = await db("items", firmId)
        .andWhereNot("id", id)
        .select();

      const duplicate = possibleDuplicates.some(
        (item) => item.name.toLowerCase() === body.name.toLowerCase()
      );

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: "Item name must be unique (case-insensitive)",
        });
      }
    }

    // Parse customFields
    if (body.customFields && typeof body.customFields === "object") {
      body.customFields = JSON.stringify(body.customFields);
    }

    const updates: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };


   // ✅ Set opening + adjust quantities
    if (body.primaryOpeningQuantity !== undefined) {
      const opening = Number(body.primaryOpeningQuantity)  - (existingItem.primaryOpeningQuantity || 0);
      updates.primaryOpeningQuantity = body.primaryOpeningQuantity;
      updates.primaryQuantity = (existingItem.primaryQuantity || 0) + opening;
    }

    if (body.secondaryOpeningQuantity !== undefined) {
      const opening = Number(body.secondaryOpeningQuantity) - (existingItem.secondaryOpeningQuantity || 0);
      updates.secondaryOpeningQuantity = body.secondaryOpeningQuantity;
      updates.secondaryQuantity = (existingItem.secondaryQuantity || 0) + opening;
    }


 

    // ✅ Other editable fields
    const allowedFields = ["name", "type", "categoryId", "unit", "description"];
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    await db("items", firmId).where("id", id).update(updates);

    const updatedItem = await db("items", firmId).where("id", id).first();

    if (updatedItem.customFields && typeof updatedItem.customFields === "string") {
      try {
        updatedItem.customFields = JSON.parse(updatedItem.customFields);
      } catch {
        // skip parsing error
      }
    }

    res.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating item ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// DELETE /items/:id - Delete item by ID
export const deleteItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { id } = req.params;

    // 1. Check if the item is used in any document
    const usedInDocuments = await db("document_items", firmId)
      .where("itemId", id)
      .first();

    if (usedInDocuments) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete item. It is used in one or more documents.",
      });
    }

    // 2. Proceed with deletion if not used
    const result = await db("items", firmId).where("id", id).delete();

    if (result === 0) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting item ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
