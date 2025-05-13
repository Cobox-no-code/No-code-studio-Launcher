import { Request, Response } from 'express';
import { db } from './../lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /unit-conversions - Get all unit conversions
export const getAllUnitConversions = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const conversions = await db('unit_conversions', firmId).select();
    res.json(conversions);
  } catch (error: any) {
    console.error('Error fetching unit conversions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /unit-conversions - Create new unit conversion
export const createUnitConversion = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const body = req.body;
    const now = new Date().toISOString();

    const newConversion = {
      id: uuidv4(),
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    await db('unit_conversions', firmId).insert(newConversion);
    res.status(201).json(newConversion);
  } catch (error: any) {
    console.error('Error creating unit conversion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /unit-conversions/:id - Get unit conversion by ID
export const getUnitConversionById = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const conversion = await db('unit_conversions', firmId).where('id', id).first();

    if (!conversion) {
      return res.status(404).json({ success: false, error: 'Unit conversion not found' });
    }

    res.json(conversion);
  } catch (error: any) {
    console.error('Error fetching unit conversion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /unit-conversions/:id - Update unit conversion by ID
export const updateUnitConversion = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;
    const body = req.body;
    const now = new Date().toISOString();

    const existingConversion = await db('unit_conversions', firmId).where('id', id).first();

    if (!existingConversion) {
      return res.status(404).json({ success: false, error: 'Unit conversion not found' });
    }

    const updatedConversion = {
      ...body,
      updatedAt: now,
    };

    await db('unit_conversions', firmId).where('id', id).update(updatedConversion);

    const conversion = await db('unit_conversions', firmId).where('id', id).first();
    res.json(conversion);
  } catch (error: any) {
    console.error('Error updating unit conversion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /unit-conversions/:id - Delete unit conversion by ID
export const deleteUnitConversion = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    const { id } = req.params;

    const existingConversion = await db('unit_conversions', firmId).where('id', id).first();

    if (!existingConversion) {
      return res.status(404).json({ success: false, error: 'Unit conversion not found' });
    }

    await db('unit_conversions', firmId).where('id', id).delete();
    res.json({ success: true, message: 'Unit conversion deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting unit conversion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
