import { IUser } from './index';
export interface IReferral {
    id: string;
    userId: string;
    refreeEmail: string;
    status: string;
    bonusAmount: number;
    createdAt: Date;
    updatedAt: Date;
    user?: IUser;
}

export type CreateReferralDto = Omit<IReferral, 'id' | 'createdAt' | 'updatedAt' | 'user'>;
export type UpdateReferralDto = Partial<CreateReferralDto>;