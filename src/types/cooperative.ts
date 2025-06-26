import { IProfitShare, IContribution, ILoan } from './index';
export interface ICooperative {
  id: string;
  name: string;
  contactPerson: string;
  status: string;
  verified: boolean;
  description?: string;
  isPublic: boolean;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  ProfitShare?: IProfitShare[];
  Contribution?: IContribution[];
  Loan?: ILoan[];
}

export type CreateCooperativeDto = Omit<ICooperative, 'id' | 'createdAt' | 'updatedAt' | 'ProfitShare' | 'Contribution' | 'Loan'>;
export type UpdateCooperativeDto = Partial<CreateCooperativeDto>;