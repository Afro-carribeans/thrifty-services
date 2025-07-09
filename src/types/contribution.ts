import { IUser, ICooperative, STATUS } from './index';

export interface IContribution {
  id: string;
  userId: string;
  amount: number;
  isActive: boolean;
  cooperativeId: string;
  frequency: string;
  status: STATUS;
  paymentId?: string;
  paymentMethod?: string;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  cooperative?: ICooperative;
}

export type CreateContributionDto = Omit<IContribution, 
  'id' | 'createdAt' | 'updatedAt' | 'user' | 'cooperative' | 'archived' | 'deleted'
>;
export type UpdateContributionDto = Partial<CreateContributionDto>;