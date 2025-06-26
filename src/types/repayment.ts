import { IUser, ILoan } from './index';
export interface IRepayment {
    id: string;
    payeeId: string;
    payerId: string;
    amount: number;
    dueDate: Date;
    loanId?: string;
    status: string;
    payments?: string;
    createdAt: Date;
    updatedAt: Date;
    userId?: string;
    loan?: ILoan;
    User?: IUser;
}

export type CreateRepaymentDto = Omit<IRepayment, 'id' | 'createdAt' | 'updatedAt' | 'loan' | 'User'>;
export type UpdateRepaymentDto = Partial<CreateRepaymentDto>;