export type DocumentType =
  | 'registration'
  | 'insurance'
  | 'permit'
  | 'road_tax'
  | 'challan'
  | 'fitness';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  registration: 'Registration Certificate (RC)',
  insurance: 'Insurance Policy',
  permit: 'Vehicle Permit',
  road_tax: 'Road Tax Certificate',
  challan: 'Traffic Challan / Fine',
  fitness: 'Fitness Certificate',
};

export type VehicleStatus = 'active' | 'maintenance' | 'grounded';

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  brandModel: string;
  driverName: string;
  status: VehicleStatus;
}

export interface DocumentAttachment {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  base64?: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  idNumber: string; // e.g. Certificate No, Policy No, Challan No etc.
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (or due date)
  amount?: number; // Cost or fine amount
  isChallanPaid?: boolean; // For Challans
  notes?: string;
  attachment?: DocumentAttachment;
  updatedAt: string;
}

export type ExpiryStatus = 'expired' | 'expiring_soon' | 'valid';

export interface FilterState {
  searchQuery: string;
  vehicleId: string;
  documentType: DocumentType | 'all';
  status: ExpiryStatus | 'all';
}
