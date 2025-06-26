import { IUser, ICooperative, IRepayment } from './index';
export interface ILoan {
  id: string;
  beneficiaryId: string;
  amount: number;
  comment?: string;
  purpose?: string;
  status: string;
  repaymentPeriod?: string;
  term?: string;
  interestRate?: number;
  guaranteed?: boolean;
  dueDate: Date;
  payments: string;
  paymentId?: string;
  cooperativeId: string;
  createdAt: Date;
  updatedAt: Date;
  beneficiary?: IUser;
  cooperative?: ICooperative;
  Repayment?: IRepayment[];
}

export type CreateLoanDto = Omit<ILoan, 'id' | 'createdAt' | 'updatedAt' | 'beneficiary' | 'cooperative' | 'Repayment'>;
export type UpdateLoanDto = Partial<CreateLoanDto>;