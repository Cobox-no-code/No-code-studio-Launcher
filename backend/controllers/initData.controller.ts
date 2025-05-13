import { Request, Response } from 'express';
import { db, initializeDatabase, initializFirm } from './../lib/db';

export const initializeDefaultData = async (firmId: string) => {
  try {
    const units = await db('units').select();
    if (units.length === 0) {
      const timestamp = new Date().toISOString();

      const defaultUnits = [
        { id: '1', firmId, fullname: 'PIECES', shortname: 'PCS', createdAt: timestamp, updatedAt: timestamp },
        { id: '2', firmId, fullname: 'KILOGRAMS', shortname: 'KG', createdAt: timestamp, updatedAt: timestamp },
        { id: '3', firmId, fullname: 'GRAMS', shortname: 'GM', createdAt: timestamp, updatedAt: timestamp },
        { id: '4', firmId, fullname: 'LITRE', shortname: 'LTR', createdAt: timestamp, updatedAt: timestamp },
        { id: '5', firmId, fullname: 'MILLILITRE', shortname: 'ML', createdAt: timestamp, updatedAt: timestamp },
        { id: '6', firmId, fullname: 'BOTTLES', shortname: 'BTL', createdAt: timestamp, updatedAt: timestamp },
        { id: '7', firmId, fullname: 'BOX', shortname: 'BOX', createdAt: timestamp, updatedAt: timestamp },
        { id: '8', firmId, fullname: 'BAGS', shortname: 'BAG', createdAt: timestamp, updatedAt: timestamp },
        { id: '9', firmId, fullname: 'DOZEN', shortname: 'DZN', createdAt: timestamp, updatedAt: timestamp },
        { id: '10', firmId, fullname: 'CARTONS', shortname: 'CTN', createdAt: timestamp, updatedAt: timestamp },
      ];

      for (const unit of defaultUnits) {
        await db('units').insert(unit);
      }

      console.log('Default units added');
    }

    console.log('Default data initialized successfully');
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  }
};

export const initDataHandler = async (req: Request, res: Response):Promise<any> => {
  try {
    const firmId = req.headers['x-firm-id'] as string || '';
    await initializeDefaultData(firmId);
    res.json({ success: true, message: "Database initialized successfully" });
  } catch (error: any) {
    console.error("Database initialization error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
