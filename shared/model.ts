export type Group = 'owners' | 'vehicles' | 'others' | 'staff' | 'narrations';
export type Entry = {
  id: string;
  [key: string]: string;
};
export type Visit = {
  id: string;
  at: string;
  checkpoint: string;
  staff: string;
  weight: number;
  fee: number;
  bill: string;
  receiptNo?: number;
  stage?: number;
  payment?: string;
};
export type Journey = {
  entryDate?: string;
  entryDateBs?: string;
  id: string;
  number: number;
  vehicle: string;
  from: string;
  to: string;
  material: string;
  company: string;
  phone: string;
  note: string;
  status: 'In Job' | 'Completed';
  visits: Visit[];
};
export type Pending = {
  entryDate?: string;
  entryDateBs?: string;
  id: string;
  plate: string;
  from: string;
  to: string;
  material: string;
};
export type Database = Record<Group, Entry[]> & {
  issuer?: {
    association: string;
    pan: string;
    phone: string;
  };
  sections?: Entry[];
  journeys: Journey[];
  pending: Pending[];
};
export type Field = {
  key: string;
  label: string;
  required?: boolean;
  choices?: string[];
  reference?: Group;
  type?: string;
};
const field = (key: string, label: string, required = false): Field => ({
  key,
  label,
  required
});
const options = (key: string, label: string, choices: string[], required = true): Field => ({
  key,
  label,
  choices,
  required
});
export const provinces = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
export const checkpoints = ['Thankot', 'Naubise', 'Muglin'];
export const groups: Group[] = ['owners', 'vehicles', 'others', 'staff', 'narrations'];
export const titles: Record<Group, string> = {
  owners: 'Vehicle owners',
  vehicles: 'Vehicles',
  others: "Other’s vehicles",
  staff: 'Checkpoint staff',
  narrations: 'Narrations'
};
export const fields: Record<Group, Field[]> = {
  owners: [
    field('name', 'Name or company', true),
    options('state', 'State', provinces),
    field('district', 'District', true),
    field('phone', 'Phone number', true),
    field('local', 'Local level'),
    field('street', 'Street address'),
    {
      ...field('email', 'Email'),
      type: 'email'
    },
    field('pan', 'PAN number'),
    options('individual', 'Owner category', ['Company', 'Individual']),
    field('contact', 'Contact person'),
    field('contactPhone', 'Contact number'),
    field('contactEmail', 'Contact email'),
    field('citizenship', 'Citizenship number'),
    {
      key: 'front',
      label: 'Citizenship front image',
      type: 'file'
    },
    {
      key: 'back',
      label: 'Citizenship back image',
      type: 'file'
    },
    field('registration', 'Registration number'),
    {
      ...field('logo', 'Owner logo'),
      type: 'file'
    },
    {
      ...field('document', 'Registration document'),
      type: 'file'
    },
    options('verification', 'Verification', ['Unverified', 'Verified']),
    field('linked', 'Linked owner'),
    options('assigned', 'Is assigned', ['Assigned', 'Unassigned'], false)
  ],
  vehicles: [
    field('plate', 'Plate number', true),
    {
      ...field('owner', 'Vehicle owner', true),
      reference: 'owners'
    },
    field('association', 'Sthaniya Sangh', true),
    options('kind', 'Vehicle type', [
      'Mini truck',
      'Medium truck',
      'Container 10 Wheeler 17 Ton',
      'Container 12 wheeler 21 ton',
      'Trailer'
    ]),
    options('color', 'Plate color', ['Black', 'Red', 'White', 'Green']),
    options('plateType', 'Plate type', ['Provincial', 'Zonal', 'Indian']),
    field('zone', 'Zonal code'),
    field('province', 'Province code'),
    field('symbol', 'Symbol number'),
    field('vehicleNumber', 'Vehicle number'),
    field('lot', 'Lot number'),
    field('engine', 'Engine number'),
    field('chassis', 'Chassis number'),
    field('company', 'Company name'),
    field('model', 'Model number'),
    field('category', 'Vehicle category'),
    field('capacity', 'Vehicle capacity (metric tons)'),
    field('tyres', 'No. of tyres'),
    {
      key: 'registeredOn',
      label: 'Registration date',
      type: 'date'
    }
  ],
  others: [
    field('plate', 'Formatted number', true),
    options('numberType', 'Number type', ['Provincial', 'Zonal', 'Others']),
    options('plateType', 'Plate type', ['Unregistered', 'Indian'])
  ],
  staff: [
    field('name', 'Staff name', true),
    options('state', 'State', provinces),
    field('district', 'District', true),
    field('street', 'Street address'),
    field('phone', 'Mobile number', true),
    {
      ...field('email', 'Email', true),
      type: 'email'
    },
    options('active', 'Status', ['Active', 'Inactive'])
  ],
  narrations: [field('name', 'Narration', true), options('active', 'Status', ['Active', 'Inactive'], false)]
};
export const profileFields: Record<string, Field[]> = {
  'Bank Details': [
    field('bank', 'Bank', true),
    field('account', 'Account number', true),
    field('holder', 'Account holder name', true),
    {
      key: 'file',
      label: 'Cheque',
      type: 'file'
    }
  ],
  'Vehicle Documents': [
    field('name', 'Document name', true),
    field('kind', 'Document type', true),
    {
      key: 'file',
      label: 'Upload document',
      type: 'file',
      required: true
    }
  ],
  'Vehicle Owner': [
    {
      key: 'owner',
      label: 'Vehicle owner',
      reference: 'owners',
      required: true
    },
    options('role', 'Owner type', ['Main Owner', 'Joint Owner']),
    field('linked', 'Linked owner')
  ],
  'Beneficiary': [
    field('name', 'Beneficiary name', true),
    field('address', 'Beneficiary address'),
    field('phone', 'Beneficiary contact number')
  ],
  'Check Pass': [
    {
      key: 'from',
      label: 'From',
      type: 'date',
      required: true
    },
    {
      key: 'to',
      label: 'To',
      type: 'date',
      required: true
    },
    {
      key: 'file',
      label: 'Check pass document',
      type: 'file'
    }
  ],
  'Route Permit': [
    field('route', 'Route permit', true),
    {
      key: 'expiry',
      label: 'Expiry date',
      type: 'date',
      required: true
    },
    {
      key: 'file',
      label: 'Document',
      type: 'file'
    }
  ],
  'Insurance': [
    field('company', 'Company', true),
    field('policy', 'Policy number', true),
    field('policyType', 'Policy type'),
    {
      key: 'start',
      label: 'Start date',
      type: 'date'
    },
    {
      key: 'expiry',
      label: 'Expiry date',
      type: 'date'
    },
    {
      key: 'file',
      label: 'Documents',
      type: 'file'
    }
  ],
  'Type Card': [
    field('card', 'Card type name', true),
    field('association', 'Sthaniya name'),
    {
      key: 'start',
      label: 'Card start on',
      type: 'date'
    },
    {
      key: 'expiry',
      label: 'Expiry date',
      type: 'date'
    }
  ],
  'Bluebook': [
    {
      key: 'start',
      label: 'Registration date',
      type: 'date',
      required: true
    },
    {
      key: 'expiry',
      label: 'Expiry date',
      type: 'date'
    },
    field('remarks', 'Features'),
    {
      key: 'file',
      label: 'Document',
      type: 'file'
    }
  ],
  'Tare Weight': [{
    key: 'weight',
    label: 'Tare weight (kg)',
    type: 'number',
    required: true
  }]
};
