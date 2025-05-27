// models.ts

// Enum for item types
export enum ItemType {
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
}

// Tax rate model
export interface TaxRate {
  id: string;
  name: string;
  rate: number; // Percentage value
  isActive: boolean;
}

// Category model
export interface Category {
  id: string;
  name: string;
  description?: string;
}

// Unit model
export interface Unit {
  id: string;
  fullname: string; // e.g., "BOTTLES"
  shortname: string; // e.g., "Btl"
}

// Unit conversion model
export interface UnitConversion {
  id: string;
  primaryUnitId: string; // Reference to Unit
  secondaryUnitId: string; // Reference to Unit
  conversionRate: number; // e.g., 10 for "1 BOTTLE = 10 BOX"
}

// Base item interface with common properties
export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  hsnCode?: string;
  itemCode?: string;
  description?: string;
  imageUrl?: string;
  categoryId: string; // Reference to Category

  // Pricing fields
  wholesaleQuantity: number;

  wholesalePrice?: number;
  salePrice: number;
  taxRate?: string; // Reference to TaxRate
}

// Product specific interface
export interface Product extends BaseItem {
  type: ItemType.PRODUCT;
  unit_conversionId: string; // Reference to Unit
  primaryQuantity?: number | undefined;
  secondaryQuantity?: number | undefined;
  // Stock fields (only relevant for products)
  purchasePriceTaxInclusive?: boolean;
  salePriceTaxInclusive?: boolean;
  purchasePrice: number;
  primaryOpeningQuantity: number;
  secondaryOpeningQuantity: number;

  pricePerUnit: number;
  openingQuantity: number;
  openingStockDate?: Date; // Optional date for opening stock
  currentQuantity: number;
  minStockLevel?: number;
  location?: string;
  updatedAt?: string;
  includeTax?: boolean;
}

// Service specific interface
export interface Service extends BaseItem {
  type: ItemType.SERVICE;
  unit_conversionId?: string; // Optional reference to Unit (for time-based services)
  primaryOpeningQuantity: number;
  secondaryOpeningQuantity: number;
  pricePerUnit: number;
  primaryQuantity?: number | undefined;
  secondaryQuantity?: number | undefined;
  openingQuantity: number;
  openingStockDate?: Date; // Optional date for opening stock
  currentQuantity: number;
  minStockLevel?: number;
  purchasePriceTaxInclusive?: boolean;
  salePriceTaxInclusive?: boolean;
  location?: string;
  updatedAt?: string;
}

// Union type for working with both products and services
export type Item = Product | Service;

// Helper function to check if an item is a product
export function isProduct(item: any): item is Product {
  return item.type === ItemType.PRODUCT;
}

// Helper function to check if an item is a service
export function isService(item: Item): item is Service {
  return item.type === ItemType.SERVICE;
}
