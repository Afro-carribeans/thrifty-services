import { IUser, ICooperative, IRepayment, STATUS } from './index';

export interface ILoan {
  id: string;
  beneficiaryId: string;
  amount: number;
  comment?: string;
  purpose?: string;
  status: STATUS;
  repaymentPeriod?: string;
  term?: string;
  interestRate?: number;
  guaranteed?: boolean;
  dueDate: Date;
  payments: string;
  paymentId?: string;
  cooperativeId: string;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  beneficiary?: IUser;
  cooperative?: ICooperative;
  Repayment?: IRepayment[];
}

export type CreateLoanDto = Omit<ILoan, 
  'id' | 'createdAt' | 'updatedAt' | 'beneficiary' | 'cooperative' | 'Repayment' | 'archived' | 'deleted'
>;
export type UpdateLoanDto = Partial<CreateLoanDto>;