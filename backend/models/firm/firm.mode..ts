export interface FirmDTO {
  id?: string;
  name: string;
  owner: string;
  country?: string;
  phone?: string;
  gstNumber?: string;
  ownerName?: string;
  businessName?: string;
  businessLogo?: string;
  createdAt?: string;
  updatedAt?: string;
  address?: string;
  cloudurl?: string;
  customFields?: Record<string, any>; // 👈 New field
}
