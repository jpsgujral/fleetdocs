import { Vehicle, VehicleDocument } from './types';

// Helper to calculate relative dates relative to current date
export const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    plateNumber: 'MH-12-GQ-4567',
    type: 'Heavy Multi-Axle Truck',
    brandModel: 'Tata Signa 4825.T',
    driverName: 'Amrik Singh',
    status: 'grounded' // Grounded because Insurance is expired!
  },
  {
    id: 'v2',
    plateNumber: 'DL-01-AF-9821',
    type: 'Light Commercial Vehicle',
    brandModel: 'Mahindra Bolero Pickup',
    driverName: 'Vikram Sharma',
    status: 'active'
  },
  {
    id: 'v3',
    plateNumber: 'HR-38-XY-0004',
    type: '10-Wheeler Cargo Truck',
    brandModel: 'Ashok Leyland Ecomet 1615',
    driverName: 'Rajesh Yadav',
    status: 'maintenance'
  },
  {
    id: 'v4',
    plateNumber: 'KA-03-MP-5512',
    type: 'Refrigerated Cold Carrier',
    brandModel: 'BharatBenz 1917R',
    driverName: 'Suresh Kumar',
    status: 'active'
  }
];

export const INITIAL_DOCUMENTS: VehicleDocument[] = [
  // Vehicle 1 (MH-12-GQ-4567) Documents
  {
    id: 'doc-v1-rc',
    vehicleId: 'v1',
    type: 'registration',
    idNumber: 'RC-MH12-2020-00948',
    issueDate: getRelativeDateString(-500),
    expiryDate: getRelativeDateString(500), // Valid
    notes: 'Primary vehicle registration. Lifetime tax paid for state cargo permit.',
    updatedAt: getRelativeDateString(-500)
  },
  {
    id: 'doc-v1-ins',
    vehicleId: 'v1',
    type: 'insurance',
    idNumber: 'INS-NEWINDIA-882194',
    amount: 24500,
    issueDate: getRelativeDateString(-370),
    expiryDate: getRelativeDateString(-5), // Expired 5 days ago! (CRITICAL)
    notes: 'Comprehensive commercial package. Waiting for approval of premium renewal quotation.',
    updatedAt: getRelativeDateString(-5),
    attachment: {
      name: 'insurance_policy_final_2025.pdf',
      size: 1450200,
      type: 'application/pdf',
      uploadedAt: getRelativeDateString(-370)
    }
  },
  {
    id: 'doc-v1-roadtax',
    vehicleId: 'v1',
    type: 'road_tax',
    amount: 12000,
    idNumber: 'TAX-MH-RTO-2811B',
    issueDate: getRelativeDateString(-350),
    expiryDate: getRelativeDateString(12), // Expiring in 12 days! (Warning)
    notes: 'State entry and road use tax payment certificate.',
    updatedAt: getRelativeDateString(-350)
  },
  {
    id: 'doc-v1-challan',
    vehicleId: 'v1',
    type: 'challan',
    idNumber: 'CH-MHTRAFFIC-9921',
    amount: 1500,
    isChallanPaid: false,
    issueDate: getRelativeDateString(-15),
    expiryDate: getRelativeDateString(5), // Due soon (Warning if unpaid)
    notes: 'Speed limit violation fine at Mumbai Expressway.',
    updatedAt: getRelativeDateString(-15)
  },

  // Vehicle 2 (DL-01-AF-9821) Documents
  {
    id: 'doc-v2-rc',
    vehicleId: 'v2',
    type: 'registration',
    idNumber: 'RC-DL01-2022-8871',
    issueDate: getRelativeDateString(-200),
    expiryDate: getRelativeDateString(800),
    notes: 'Clean status registration',
    updatedAt: getRelativeDateString(-200)
  },
  {
    id: 'doc-v2-permit',
    vehicleId: 'v2',
    type: 'permit',
    idNumber: 'NP-DL-982218D',
    issueDate: getRelativeDateString(-300),
    expiryDate: getRelativeDateString(65), // Good
    notes: 'All India Goods Carriage Permit.',
    updatedAt: getRelativeDateString(-300)
  },
  {
    id: 'doc-v2-fitness',
    vehicleId: 'v2',
    type: 'fitness',
    idNumber: 'FIT-DL-EAST-44211',
    issueDate: getRelativeDateString(-357),
    expiryDate: getRelativeDateString(8), // Expiring in 8 days! (Warning)
    notes: 'RTO Fitness clearance. Inspections needed for renewal before coming Tuesday.',
    updatedAt: getRelativeDateString(-357)
  },

  // Vehicle 3 (HR-38-XY-0004) Documents
  {
    id: 'doc-v3-rc',
    vehicleId: 'v3',
    type: 'registration',
    idNumber: 'RC-HR38-2018-0283',
    issueDate: getRelativeDateString(-1200),
    expiryDate: getRelativeDateString(200),
    updatedAt: getRelativeDateString(-1200)
  },
  {
    id: 'doc-v3-insurance',
    vehicleId: 'v3',
    type: 'insurance',
    idNumber: 'INS-ICICI-662310',
    amount: 22000,
    issueDate: getRelativeDateString(-10),
    expiryDate: getRelativeDateString(355), // Healthy
    notes: 'Renewed premium active',
    updatedAt: getRelativeDateString(-10)
  },
  {
    id: 'doc-v3-fitness',
    vehicleId: 'v3',
    type: 'fitness',
    idNumber: 'FIT-HR-FARIDABAD-1',
    issueDate: getRelativeDateString(-390),
    expiryDate: getRelativeDateString(-25), // Expired 25 days ago! (CRITICAL)
    notes: 'Suspended container chassis. Vehicle currently routed for major brake repairs.',
    updatedAt: getRelativeDateString(-390)
  },

  // Vehicle 4 (KA-03-MP-5512) Documents
  {
    id: 'doc-v4-rc',
    vehicleId: 'v4',
    type: 'registration',
    idNumber: 'RC-KA03-2024-9988',
    issueDate: getRelativeDateString(-50),
    expiryDate: getRelativeDateString(1000),
    updatedAt: getRelativeDateString(-50)
  },
  {
    id: 'doc-v4-insurance',
    vehicleId: 'v4',
    type: 'insurance',
    idNumber: 'INS-HDFC-994411',
    amount: 19800,
    issueDate: getRelativeDateString(-50),
    expiryDate: getRelativeDateString(315),
    updatedAt: getRelativeDateString(-50)
  },
  {
    id: 'doc-v4-permit',
    vehicleId: 'v4',
    type: 'permit',
    idNumber: 'NP-KA-45521A',
    issueDate: getRelativeDateString(-50),
    expiryDate: getRelativeDateString(315),
    updatedAt: getRelativeDateString(-50),
    attachment: {
      name: 'national_permit_permit_refrigerated_cargo.pdf',
      size: 981240,
      type: 'application/pdf',
      uploadedAt: getRelativeDateString(-50)
    }
  }
];
