import { IUser, ICooperative } from './index';
export interface IContribution {
  id: string;
  userId: string;
  amount: number;
  isActive: boolean;
  cooperativeId: string;
  frequency: string;
  status: string;
  paymentId?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  cooperative?: ICooperative;
}

export type CreateContributionDto = Omit<IContribution, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'cooperative'>;
export type UpdateContributionDto = Partial<CreateContributionDto>;