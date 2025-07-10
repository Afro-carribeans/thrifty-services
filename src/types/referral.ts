import { IUser, STATUS } from './index';

export interface IReferral {
  id: string;
  userId: string;
  refreeEmail: string;
  status: STATUS;
  bonusAmount: number;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
}

export type CreateReferralDto = Omit<IReferral, 
  'id' | 'createdAt' | 'updatedAt' | 'user' | 'archived' | 'deleted'
>;
export type UpdateReferralDto = Partial<CreateReferralDto>;