import { Request, Response } from "express";
import { db } from "./../lib/db";
import { v4 as uuidv4 } from "uuid";

// GET /parties - List all parties with filters
export const getAllParties = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { groupId, gstType, search } = req.query;

    let query = db("parties", firmId);
    if (groupId) query = query.where("groupId", groupId);
    if (gstType) query = query.where("gstType", gstType);

    let parties = await query.select();
    const partyIds = parties.map((p) => p.id);

    let additionalFields = [];
    if (partyIds.length > 0) {
      additionalFields = await db("party_additional_fields", firmId)
        .whereIn("partyId", partyIds)
        .select();
    }

    const partiesWithFields = parties.map((party) => {
      const fields = additionalFields.filter((f) => f.partyId === party.id);
      return {
        ...party,
        additionalFields: fields.map((f) => ({
          key: f.fieldKey,
          value: f.fieldValue,
        })),
        shippingEnabled: Boolean(party.shippingEnabled),
        paymentReminderEnabled: Boolean(party.paymentReminderEnabled),
        loyaltyPointsEnabled: Boolean(party.loyaltyPointsEnabled),
      };
    });

    if (search) {
      const s = (search as string).toLowerCase();
      return res.json(
        partiesWithFields.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            (p.phone && p.phone.includes(s)) ||
            (p.email && p.email.toLowerCase().includes(s)) ||
            (p.gstNumber && p.gstNumber.toLowerCase().includes(s))
        )
      );
    }

    res.json(partiesWithFields);
  } catch (error: any) {
    console.error("Error fetching parties:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /parties - Create new party
// POST /parties - Create new party
export const createParty = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { additionalFields, name, ...partyData } = req.body;
    const now = new Date().toISOString();
    const partyId = uuidv4();

    // Check if a party with the same name already exists
    const existingParties = await db("parties", firmId).select(); // fetch all fields

    // Then extract names in JS
    const exists = existingParties.some(
      (party) => party.name?.toLowerCase() === name?.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "Party name must be unique (case-insensitive)",
      });
    }

    const newParty = {
      id: partyId,
      name,
      currentBalance: partyData.openingBalance,
      currentBalanceType: partyData.openingBalanceType,
      ...partyData,
      createdAt: now,
      updatedAt: now,
    };

    await db("parties", firmId).insert(newParty);

    if (additionalFields?.length > 0) {
      for (const field of additionalFields) {
        await db("party_additional_fields", firmId).insert({
          id: uuidv4(),
          partyId,
          fieldKey: field.key,
          fieldValue: field.value,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    res.status(201).json({
      ...newParty,
      shippingEnabled: Boolean(newParty.shippingEnabled),
      paymentReminderEnabled: Boolean(newParty.paymentReminderEnabled),
      loyaltyPointsEnabled: Boolean(newParty.loyaltyPointsEnabled),
      additionalFields: additionalFields || [],
    });
  } catch (error: any) {
    console.error("Error creating party:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /parties/:id - Fetch single party
export const getPartyById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { id } = req.params;

    const party = await db("parties", firmId).where("id", id).first();
    if (!party)
      return res.status(404).json({ success: false, error: "Party not found" });

    const additionalFields = await db("party_additional_fields", firmId)
      .where("partyId", id)
      .select();

    const formattedFields = additionalFields.map((f) => ({
      key: f.fieldKey,
      value: f.fieldValue,
    }));

    const booleanFields = [
      "shippingEnabled",
      "paymentReminderEnabled",
      "loyaltyPointsEnabled",
    ];
    booleanFields.forEach((field) => {
      if (field in party) party[field] = Boolean(party[field]);
    });

    res.json({ ...party, additionalFields: formattedFields });
  } catch (error: any) {
    console.error("Error fetching party:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /parties/:id - Update party
export const updateParty = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { id } = req.params;
    const {
      additionalFields,
      name,
      openingBalance,
      openingBalanceType,
      currentBalanceType,
      ...updateData
    } = req.body;

    const existingParty = await db("parties", firmId).where("id", id).first();
    if (!existingParty) {
      return res.status(404).json({ success: false, error: "Party not found" });
    }

    // Validate name uniqueness and usage in documents
    if (name && name !== existingParty.name) {
      const usedInDocuments = await db("document_items", firmId)
        .where("itemId", id)
        .first();

      if (usedInDocuments) {
        return res.status(400).json({
          success: false,
          error: "Cannot update Party name. The Party is used in one or more documents.",
        });
      }

      const possibleDuplicates = await db("parties", firmId)
        .andWhereNot("id", id)
        .select();

      const duplicate = possibleDuplicates.some(
        (party) => party.name.toLowerCase() === name.toLowerCase()
      );

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: "Party name must be unique (case-insensitive)",
        });
      }
    }

    const now = new Date().toISOString();
    updateData.updatedAt = now;
    if (name) updateData.name = name;

  
       
        updateData.openingBalance = Number(openingBalance);
        updateData.openingBalanceType = openingBalanceType;
         updateData.currentBalance = (existingParty.currentBalance - existingParty.openingBalance) + Number(openingBalance);
        updateData.currentBalanceType = currentBalanceType;

    await db("parties", firmId).where("id", id).update(updateData);

    // Update additional fields if provided
    if (additionalFields) {
      await db("party_additional_fields", firmId).where("partyId", id).delete();

      for (const field of additionalFields) {
        await db("party_additional_fields", firmId).insert({
          id: uuidv4(),
          partyId: id,
          fieldKey: field.key,
          fieldValue: field.value,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const updatedParty = await db("parties", firmId).where("id", id).first();
    const updatedFields = await db("party_additional_fields", firmId)
      .where("partyId", id)
      .select();

    const formattedFields = updatedFields.map((f) => ({
      key: f.fieldKey,
      value: f.fieldValue,
    }));

    // Convert booleans
    ["shippingEnabled", "paymentReminderEnabled", "loyaltyPointsEnabled"].forEach((field) => {
      if (field in updatedParty)
        updatedParty[field] = Boolean(updatedParty[field]);
    });

    res.json({ ...updatedParty, additionalFields: formattedFields });
  } catch (error: any) {
    console.error("Error updating party:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// DELETE /parties/:id - Delete party
export const deleteParty = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const firmId = (req.headers["x-firm-id"] as string) || "";
    const { id } = req.params;

    const existingParty = await db("parties", firmId).where("id", id).first();
    if (!existingParty)
      return res.status(404).json({ success: false, error: "Party not found" });
    const documentRef = await db("documents", firmId)
      .where("partyId", id)
      .first();
       const paymentRef = await db("payments", firmId)
      .where("partyId", id)
      .first();
    if (documentRef || paymentRef) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete party because it is referenced in one or more documents and payments",
      });
    }
    await db("party_additional_fields", firmId).where("partyId", id).delete();
    await db("parties", firmId).where("id", id).delete();

    res.json({ success: true, message: "Party deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting party:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
