import { IUser, ICooperative } from './index';
export interface IProfitShare {
  id: string;
  period: Date;
  userId: string;
  amount: number;
  comment?: string;
  status: string;
  cooperativeId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  cooperative?: ICooperative;
}

export type CreateProfitShareDto = Omit<IProfitShare, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'cooperative'>;
export type UpdateProfitShareDto = Partial<CreateProfitShareDto>;