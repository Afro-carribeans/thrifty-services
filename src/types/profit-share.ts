import { IUser, ICooperative, STATUS } from './index';

export interface IProfitShare {
  id: string;
  period: Date;
  userId: string;
  amount: number;
  comment?: string;
  status: STATUS;
  cooperativeId: string;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  cooperative?: ICooperative;
}

export type CreateProfitShareDto = Omit<IProfitShare, 
  'id' | 'createdAt' | 'updatedAt' | 'user' | 'cooperative' | 'archived' | 'deleted'
>;
export type UpdateProfitShareDto = Partial<CreateProfitShareDto>;