import { IProfitShare, IContribution, ILoan, STATUS } from './index';

export interface ICooperative {
  id: string;
  name: string;
  contactPerson: string;
  status: STATUS;
  verified: boolean;
  description?: string;
  isPublic: boolean;
  creator: string;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  ProfitShare?: IProfitShare[];
  Contribution?: IContribution[];
  Loan?: ILoan[];
}

export type CreateCooperativeDto = Omit<ICooperative, 
  'id' | 'createdAt' | 'updatedAt' | 'ProfitShare' | 'Contribution' | 'Loan' | 'archived' | 'deleted'
>;
export type UpdateCooperativeDto = Partial<CreateCooperativeDto>;