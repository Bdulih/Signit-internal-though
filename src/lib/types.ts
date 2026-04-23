export type CompanyType = 'LLC' | 'JSC';
export type CollateralType = 'none' | 'company-owned' | 'third-party';

export interface Guarantor {
  id: string;
  name: string;
  nationalId: string;
}

export interface Company {
  name: string;
  crNumber: string;
  articlesRef: string;
  type: CompanyType;
  nationalAddress: string;
}

export interface Signer {
  fullName: string;
  nationalId: string;
  idExpiry: string;
  email: string;
  mobile: string;
}

export interface Guarantee {
  amountSar: number;
  guarantors: Guarantor[];
}

export interface AuditEntry {
  docId: string;
  docTitle: string;
  signedAt: string;
  otpUsed: string;
  signatureDataUrl: string;
}

export interface Borrower {
  id: string;
  createdAt: string;
  company: Company;
  signer: Signer;
  guarantee: Guarantee;
  collateral: CollateralType;
  auditLog: AuditEntry[];
}

export interface ContractDoc {
  id: string;
  title: string;
  phase: 1 | 2;
  signable: boolean;
  guarantorId?: string;
  bodyParagraphs: (b: Borrower) => string[];
}
