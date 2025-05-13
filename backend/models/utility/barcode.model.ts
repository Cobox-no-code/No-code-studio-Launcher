// models/barcode.model.ts

export interface Barcode {
    id: string;
    itemName: string;
    itemCode: string;
    numberOfLabels: number;
    header?: string;
    line1?: string;
    line2?: string;
    salePrice?: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface BarcodeTemplate {
    id: string;
    name: string;
    size: string; // e.g., "65 Labels (38 × 21mm)"
    isDefault: boolean;
  }
  
  export interface Printer {
    id: string;
    name: string;
    isDefault: boolean;
  }
  
  export interface BarcodeGenerationRequest {
    itemName: string;
    itemCode: string;
    numberOfLabels: number;
    header?: string;
    line1?: string;
    line2?: string;
    salePrice?: number;
    templateId?: string;
    printerId?: string;
  }
  
  export interface BarcodeGenerationResponse {
    id: string;
    pdfUrl: string;
    message: string;
  }
  
  export type BarcodeSize = '65 Labels (38 × 21mm)' | '40 Labels (48 × 25mm)' | '24 Labels (64 × 34mm)';
  export type PrinterType = 'Regular Printer' | 'Thermal Printer' | 'Label Printer';