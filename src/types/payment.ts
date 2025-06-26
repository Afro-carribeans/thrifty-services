import { IUser } from './index';
export interface IPayment {
  id: string;
  payeeId: string;
  payerId: string;
  amount: number;
  comment?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  User?: IUser;
}

export type CreatePaymentDto = Omit<IPayment, 'id' | 'createdAt' | 'updatedAt' | 'User'>;
export type UpdatePaymentDto = Partial<CreatePaymentDto>;