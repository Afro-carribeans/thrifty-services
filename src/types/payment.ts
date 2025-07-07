import { IUser, STATUS } from './index';

export interface IPayment {
  id: string;
  payeeId: string;
  payerId: string;
  amount: number;
  comment?: string;
  status: STATUS;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  User?: IUser;
}

export type CreatePaymentDto = Omit<IPayment, 
  'id' | 'createdAt' | 'updatedAt' | 'User' | 'archived' | 'deleted'
>;
export type UpdatePaymentDto = Partial<CreatePaymentDto>;