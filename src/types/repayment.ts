import { IUser, ILoan, STATUS } from './index';

export interface IRepayment {
  id: string;
  payeeId: string;
  payerId: string;
  amount: number;
  dueDate: Date;
  loanId?: string;
  status: STATUS;
  payments?: string;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  loan?: ILoan;
  User?: IUser;
}

export type CreateRepaymentDto = Omit<IRepayment, 
  'id' | 'createdAt' | 'updatedAt' | 'loan' | 'User' | 'archived' | 'deleted'
>;
export type UpdateRepaymentDto = Partial<CreateRepaymentDto>;